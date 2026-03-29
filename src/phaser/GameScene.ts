import Phaser from 'phaser';
import { SURFACE_PADS, SURFACE_SKY_ROWS, TILE_SIZE, WORLD_WIDTH } from '../config/content';
import { getConsumableEffectRenderState, getDrillRenderState } from '../game/logic';
import { ensureRows, getCell } from '../game/world';
import type { ControlState } from '../types';
import type { DiggrApp } from '../ui/DiggrApp';
import {
  DIGGER_ANIMATIONS,
  DIGGER_SPRITE_SIZE,
  DIGGER_TRANSIENT_DURATIONS,
  getConsumableEffectStyle,
  getDirectionalDrillErosionRect,
  getDrillMaskRect,
  getDrillOverlayStyle,
  getDrillRigOffset,
  getDrillTerrainFrame,
  getPlayerRenderY,
  getShopRenderLayout,
  getSurfaceGroundFrame,
  getTerrainFrame,
  resolveDiggerRenderState,
  type DiggerFacing,
  type DiggerRenderState,
} from './rendering';

const DIGGER_TEXTURE_KEY = 'digger-sheet';
const SHOP_TEXTURE_KEY = 'surface-shops';
const TERRAIN_TEXTURE_KEY = 'terrain-sheet';

const DIGGER_TEXTURE_URL = new URL('../assets/sprites/digger-sheet.png', import.meta.url).href;
const SHOP_TEXTURE_URL = new URL('../assets/sprites/surface-shops.png', import.meta.url).href;
const TERRAIN_TEXTURE_URL = new URL('../assets/sprites/terrain-sheet.png', import.meta.url).href;

export class GameScene extends Phaser.Scene {
  static readonly KEY = 'game-scene';

  private worldGraphics: Phaser.GameObjects.Graphics | null = null;
  private effectGraphics: Phaser.GameObjects.Graphics | null = null;
  private playerSprite: Phaser.GameObjects.Sprite | null = null;
  private shopSprites: Phaser.GameObjects.Image[] = [];
  private terrainSprites: Phaser.GameObjects.Image[] = [];
  private surfaceSprites: Phaser.GameObjects.Image[] = [];
  private activeDrillSprite: Phaser.GameObjects.Image | null = null;
  private activeDrillMaskGraphics: Phaser.GameObjects.Graphics | null = null;
  private shopLabels: Phaser.GameObjects.Text[] = [];
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private consumableKeys: Record<string, Phaser.Input.Keyboard.Key> = {};
  private tileSize = TILE_SIZE;
  private lastFacing: DiggerFacing = 'right';
  private transientState: { state: DiggerRenderState; remaining: number } | null = null;

  constructor() {
    super(GameScene.KEY);
  }

  preload(): void {
    this.load.spritesheet(TERRAIN_TEXTURE_KEY, TERRAIN_TEXTURE_URL, { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet(DIGGER_TEXTURE_KEY, DIGGER_TEXTURE_URL, { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet(SHOP_TEXTURE_KEY, SHOP_TEXTURE_URL, { frameWidth: 16, frameHeight: 16 });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0e1623');
    this.worldGraphics = this.add.graphics();
    this.effectGraphics = this.add.graphics();
    this.effectGraphics.setDepth(2.6);
    this.playerSprite = this.add.sprite(0, 0, DIGGER_TEXTURE_KEY, DIGGER_ANIMATIONS.idle_grounded.frames[0]);
    this.playerSprite.setDepth(3);
    this.playerSprite.setOrigin(0.5, 0.5);
    // The active drill target renders through its own masked full-size sprite so
    // the block art stays intact while the visible area gets eaten away.
    this.activeDrillSprite = this.add.image(0, 0, TERRAIN_TEXTURE_KEY, 0);
    this.activeDrillSprite.setDepth(1);
    this.activeDrillSprite.setOrigin(0, 0);
    this.activeDrillSprite.setVisible(false);
    this.activeDrillMaskGraphics = this.make.graphics();
    this.activeDrillSprite.setMask(this.activeDrillMaskGraphics.createGeometryMask());
    this.createDiggerAnimations();

    this.cursors = this.input.keyboard?.createCursorKeys() ?? null;
    this.consumableKeys = this.input.keyboard?.addKeys({
      z: Phaser.Input.Keyboard.KeyCodes.Z,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      x: Phaser.Input.Keyboard.KeyCodes.X,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      c: Phaser.Input.Keyboard.KeyCodes.C,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      f: Phaser.Input.Keyboard.KeyCodes.F,
      v: Phaser.Input.Keyboard.KeyCodes.V,
      q: Phaser.Input.Keyboard.KeyCodes.Q,
    }) as Record<string, Phaser.Input.Keyboard.Key>;

    this.shopSprites = SURFACE_PADS.map((pad) => {
      const sprite = this.add.image(0, 0, SHOP_TEXTURE_KEY, pad.spriteFrame);
      sprite.setDepth(2);
      sprite.setOrigin(0.5, 1);
      return sprite;
    });

    this.shopLabels = SURFACE_PADS.map((pad) => {
      const label = this.add.text(pad.x * TILE_SIZE, pad.y * TILE_SIZE - 34, pad.label, {
        fontFamily: '"Courier New"',
        fontSize: '12px',
        color: '#f6ebc9',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 6,
      });
      label.setDepth(4);
      label.setOrigin(0.5, 0.5);
      return label;
    });

    this.scale.on('resize', this.handleResize, this);
    this.handleResize();
    this.renderState({
      left: false,
      right: false,
      up: false,
      down: false,
    });
    this.getApp().sceneDidRender();
  }

  update(_time: number, delta: number): void {
    const app = this.getApp();
    const state = app.getState();
    if (!state) {
      return;
    }

    const controls: ControlState = {
      left: Boolean(this.cursors?.left.isDown),
      right: Boolean(this.cursors?.right.isDown),
      up: Boolean(this.cursors?.up.isDown),
      down: Boolean(this.cursors?.down.isDown),
      consume: [],
      toggleInventory: false,
    };

    const consumeMap: Record<string, ControlState['consume'][number]> = {
      z: 'repair_nanobot',
      a: 'repair_microbot',
      x: 'small_fuel_tank',
      s: 'large_fuel_tank',
      c: 'small_tnt',
      d: 'large_tnt',
      f: 'matter_transporter',
      v: 'quantum_fissurizer',
    };

    for (const [key, type] of Object.entries(consumeMap)) {
      if (Phaser.Input.Keyboard.JustDown(this.consumableKeys[key])) {
        controls.consume.push(type);
      }
    }

    const previousHealth = state.player.health;
    const result = app.tick(controls, delta / 1000);
    const nextState = app.getState();
    if (nextState) {
      this.updateTransientState(nextState, controls, result?.toast, delta / 1000, previousHealth);
    }

    this.renderState(controls);
  }

  private renderState(controls: Pick<ControlState, 'left' | 'right' | 'up' | 'down'>): void {
    const app = this.getApp();
    const state = app.getState();
    if (!state || !this.worldGraphics || !this.effectGraphics || !this.playerSprite) {
      return;
    }

    const tileSize = this.tileSize;
    ensureRows(state.world, Math.floor(state.player.position.y) - 8, Math.floor(state.player.position.y) + 40);

    const playerRenderY = getPlayerRenderY(state.player.position.y);
    const drillRenderState = getDrillRenderState(state.player);
    const drillRigOffset =
      drillRenderState === null ? { xTiles: 0, yTiles: 0 } : getDrillRigOffset(drillRenderState, state.player.position);
    const drillWobble =
      drillRenderState === null
        ? 0
        : Math.sin(this.time.now * 0.045) * tileSize * 0.035 * (drillRenderState.direction === 'left' ? -1 : 1);
    this.playerSprite.setPosition(
      (state.player.position.x + drillRigOffset.xTiles) * tileSize + drillWobble,
      (playerRenderY + drillRigOffset.yTiles) * tileSize,
    );
    this.cameras.main.startFollow(this.playerSprite, true, 0.12, 0.12);
    this.syncDiggerAnimation(state, controls);

    const graphics = this.worldGraphics;
    const effectGraphics = this.effectGraphics;
    graphics.clear();
    effectGraphics.clear();

    const camera = this.cameras.main;
    const minRow = Math.max(0, Math.floor(camera.worldView.y / tileSize) - 2);
    const maxRow = Math.max(minRow + 14, Math.floor((camera.worldView.y + camera.height) / tileSize) + 3);

    graphics.fillStyle(0x13223b, 1);
    graphics.fillRect(0, -SURFACE_SKY_ROWS * tileSize, WORLD_WIDTH * tileSize, SURFACE_SKY_ROWS * tileSize);
    this.ensureSurfacePool(WORLD_WIDTH);
    for (let x = 0; x < WORLD_WIDTH; x += 1) {
      const sprite = this.surfaceSprites[x];
      sprite.setFrame(getSurfaceGroundFrame(x));
      sprite.setDisplaySize(tileSize, tileSize);
      sprite.setPosition(x * tileSize, -0.72 * tileSize);
      sprite.setVisible(true);
    }

    this.shopLabels.forEach((label, index) => {
      const pad = SURFACE_PADS[index];
      const layout = getShopRenderLayout(pad, tileSize);
      label.setPosition(layout.labelX, layout.labelY);
      label.setFontSize(layout.fontSize);
      label.setAlpha(state.player.lastSurfaceZone === pad.shop ? 1 : 0.72);
    });

    this.shopSprites.forEach((sprite, index) => {
      const pad = SURFACE_PADS[index];
      const layout = getShopRenderLayout(pad, tileSize);
      sprite.setPosition(layout.spriteX, layout.spriteY);
      sprite.setDisplaySize(layout.spriteWidth, layout.spriteHeight);
      sprite.setAlpha(state.player.lastSurfaceZone === pad.shop ? 1 : 0.9);
    });

    const requiredTerrainSprites = WORLD_WIDTH * (maxRow - minRow + 1);
    this.ensureTerrainPool(requiredTerrainSprites);

    let spriteIndex = 0;
    for (let row = minRow; row <= maxRow; row += 1) {
      for (let x = 0; x < WORLD_WIDTH; x += 1) {
        const cell = getCell(state.world, x, row);
        const isActiveDrillTarget = drillRenderState !== null && drillRenderState.x === x && drillRenderState.row === row;
        const frame = isActiveDrillTarget ? getDrillTerrainFrame(drillRenderState, x, row) : getTerrainFrame(cell, x, row);
        if (frame === null) {
          continue;
        }

        if (isActiveDrillTarget) {
          continue;
        }

        const sprite = this.terrainSprites[spriteIndex];
        sprite.setFrame(frame);
        sprite.setCrop();
        sprite.setDisplaySize(tileSize, tileSize);
        sprite.setPosition(x * tileSize, row * tileSize);
        sprite.setVisible(true);
        spriteIndex += 1;
      }
    }

    for (let index = spriteIndex; index < this.terrainSprites.length; index += 1) {
      this.terrainSprites[index].setVisible(false);
    }

    if (drillRenderState && this.activeDrillSprite && this.activeDrillMaskGraphics) {
      const erosion = getDirectionalDrillErosionRect(drillRenderState);
      const overlay = getDrillOverlayStyle(drillRenderState);
      const glowPulse = 0.88 + (Math.sin(this.time.now * 0.014) + 1) * 0.08;
      const blockX = drillRenderState.x * tileSize;
      const blockY = drillRenderState.row * tileSize;
      const maskRect = getDrillMaskRect(drillRenderState, tileSize);
      const visibleX = maskRect.x;
      const visibleY = maskRect.y;
      const visibleWidth = maskRect.width;
      const visibleHeight = maskRect.height;
      const activeFrame = getDrillTerrainFrame(drillRenderState, drillRenderState.x, drillRenderState.row);

      if (activeFrame !== null) {
        this.activeDrillSprite.setFrame(activeFrame);
        this.activeDrillSprite.setDisplaySize(tileSize, tileSize);
        this.activeDrillSprite.setPosition(blockX, blockY);
        this.activeDrillSprite.setVisible(true);
        this.activeDrillMaskGraphics.clear();
        this.activeDrillMaskGraphics.fillStyle(0xffffff, 1);
        this.activeDrillMaskGraphics.fillRect(maskRect.x, maskRect.y, maskRect.width, maskRect.height);
      } else {
        this.activeDrillSprite.setVisible(false);
        this.activeDrillMaskGraphics.clear();
      }

      if (overlay.fillAlpha > 0 && visibleWidth > 0 && visibleHeight > 0) {
        graphics.fillStyle(overlay.fillColor, overlay.fillAlpha * glowPulse);
        graphics.fillRect(visibleX, visibleY, visibleWidth, visibleHeight);
      }

      graphics.lineStyle(3, overlay.edgeColor, overlay.edgeAlpha * glowPulse);
      if (erosion.edge === 'left') {
        graphics.beginPath();
        graphics.moveTo(visibleX + 1, visibleY + 2);
        graphics.lineTo(visibleX + 1, visibleY + visibleHeight - 2);
        graphics.strokePath();
      } else if (erosion.edge === 'right') {
        const edgeX = visibleX + visibleWidth - 1;
        graphics.beginPath();
        graphics.moveTo(edgeX, visibleY + 2);
        graphics.lineTo(edgeX, visibleY + visibleHeight - 2);
        graphics.strokePath();
      } else {
        graphics.beginPath();
        graphics.moveTo(visibleX + 2, visibleY + 1);
        graphics.lineTo(visibleX + visibleWidth - 2, visibleY + 1);
        graphics.strokePath();
      }
    } else if (this.activeDrillSprite && this.activeDrillMaskGraphics) {
      this.activeDrillSprite.setVisible(false);
      this.activeDrillMaskGraphics.clear();
    }

    const consumableEffect = getConsumableEffectRenderState(state.activeConsumableEffect);
    if (consumableEffect) {
      this.drawConsumableEffect(effectGraphics, consumableEffect);
    }
  }

  private handleResize(): void {
    this.tileSize = this.scale.width / WORLD_WIDTH;
    this.cameras.main.setBounds(0, -SURFACE_SKY_ROWS * this.tileSize, this.scale.width, this.tileSize * 5000);
    this.playerSprite?.setDisplaySize(
      this.tileSize * DIGGER_SPRITE_SIZE.widthTiles,
      this.tileSize * DIGGER_SPRITE_SIZE.heightTiles,
    );
  }

  private getApp(): DiggrApp {
    return this.game.registry.get('app') as DiggrApp;
  }

  private createDiggerAnimations(): void {
    Object.values(DIGGER_ANIMATIONS).forEach((animation) => {
      if (this.anims.exists(animation.key)) {
        return;
      }

      this.anims.create({
        key: animation.key,
        frames: animation.frames.map((frame) => ({ key: DIGGER_TEXTURE_KEY, frame })),
        frameRate: animation.frameRate,
        repeat: animation.repeat,
      });
    });
  }

  private ensureTerrainPool(requiredCount: number): void {
    while (this.terrainSprites.length < requiredCount) {
      const sprite = this.add.image(0, 0, TERRAIN_TEXTURE_KEY, 0);
      sprite.setDepth(1);
      sprite.setOrigin(0, 0);
      sprite.setVisible(false);
      this.terrainSprites.push(sprite);
    }
  }

  private ensureSurfacePool(requiredCount: number): void {
    while (this.surfaceSprites.length < requiredCount) {
      const sprite = this.add.image(0, 0, TERRAIN_TEXTURE_KEY, 14);
      sprite.setDepth(1);
      sprite.setOrigin(0, 0);
      sprite.setVisible(false);
      this.surfaceSprites.push(sprite);
    }
  }

  private updateTransientState(
    state: NonNullable<ReturnType<DiggrApp['getState']>>,
    _controls: Pick<ControlState, 'left' | 'right' | 'up' | 'down'>,
    _toast: string | undefined,
    dtSeconds: number,
    previousHealth: number,
  ): void {
    if (state.status === 'game_over') {
      this.transientState = { state: 'destroyed', remaining: Number.POSITIVE_INFINITY };
      return;
    }

    if (state.player.health < previousHealth) {
      this.transientState = {
          state: 'damaged',
          remaining: DIGGER_TRANSIENT_DURATIONS.damaged,
        };
    } else {
      const drillState = getDrillTransientState(state);
      if (drillState) {
        this.transientState = {
          state: drillState,
          remaining: DIGGER_TRANSIENT_DURATIONS.drill,
        };
      } else if (this.transientState && Number.isFinite(this.transientState.remaining)) {
        this.transientState = {
          ...this.transientState,
          remaining: this.transientState.remaining - dtSeconds,
        };

        if (this.transientState.remaining <= 0) {
          this.transientState = null;
        }
      }
    }

  }

  private syncDiggerAnimation(state: NonNullable<ReturnType<DiggrApp['getState']>>, controls: Pick<ControlState, 'left' | 'right' | 'up' | 'down'>): void {
    if (!this.playerSprite) {
      return;
    }

    const resolved = resolveDiggerRenderState({
      state,
      controls,
      previousFacing: this.lastFacing,
      transientState: this.transientState?.state ?? null,
    });

    this.lastFacing = resolved.facing;
    if (this.playerSprite.anims.currentAnim?.key !== resolved.animationKey) {
      this.playerSprite.play(resolved.animationKey, true);
    }

    this.playerSprite.setFlipX(resolved.flipX);
  }

  private drawConsumableEffect(
    graphics: Phaser.GameObjects.Graphics,
    effect: NonNullable<ReturnType<typeof getConsumableEffectRenderState>>,
  ): void {
    if (!this.playerSprite) {
      return;
    }

    const style = getConsumableEffectStyle(effect);
    const centerX = this.playerSprite.x;
    const centerY = this.playerSprite.y;
    const pulse = 0.86 + (Math.sin(this.time.now * 0.018) + 1) * 0.09;
    const progress = effect.progress;
    const radius = this.tileSize * style.radiusTiles * (0.45 + progress * 0.75) * pulse;
    const secondaryRadius = this.tileSize * style.secondaryRadiusTiles * (0.65 + progress * 0.55);

    if (style.kind === 'repair') {
      graphics.lineStyle(3, style.primaryColor, 0.85 - progress * 0.25);
      graphics.strokeCircle(centerX, centerY, radius);
      graphics.lineStyle(2, style.accentColor, 0.72 - progress * 0.22);
      graphics.strokeCircle(centerX, centerY, secondaryRadius);

      for (let index = 0; index < style.particleCount; index += 1) {
        const angle = progress * 5.6 + (index / style.particleCount) * Math.PI * 2;
        const orbit = radius * (0.58 + 0.16 * Math.sin(this.time.now * 0.01 + index));
        const x = centerX + Math.cos(angle) * orbit;
        const y = centerY + Math.sin(angle) * orbit;
        graphics.fillStyle(style.accentColor, 0.92);
        graphics.fillRect(x - 2, y - 2, 4, 4);
      }

      graphics.lineStyle(2, style.accentColor, 0.7);
      graphics.beginPath();
      graphics.moveTo(centerX, centerY - secondaryRadius);
      graphics.lineTo(centerX, centerY + secondaryRadius);
      graphics.moveTo(centerX - secondaryRadius, centerY);
      graphics.lineTo(centerX + secondaryRadius, centerY);
      graphics.strokePath();
      return;
    }

    if (style.kind === 'fuel') {
      const beamWidth = this.tileSize * (0.18 + progress * 0.08);
      const beamHeight = this.tileSize * (0.5 + progress * 0.28);
      graphics.fillStyle(style.primaryColor, 0.24 + progress * 0.12);
      graphics.fillRect(centerX - beamWidth / 2, centerY + this.tileSize * 0.15 - beamHeight, beamWidth, beamHeight);
      graphics.lineStyle(2, style.accentColor, 0.9);
      graphics.strokeCircle(centerX, centerY + this.tileSize * 0.06, secondaryRadius);

      for (let index = 0; index < style.particleCount; index += 1) {
        const phase = (progress * 1.2 + index / style.particleCount) % 1;
        const x = centerX + (index - (style.particleCount - 1) / 2) * this.tileSize * 0.12;
        const y = centerY + this.tileSize * 0.3 - phase * beamHeight;
        graphics.fillStyle(style.accentColor, 0.86 - phase * 0.3);
        graphics.fillCircle(x, y, this.tileSize * 0.06);
      }
      return;
    }

    if (style.kind === 'blast') {
      const blastRadius = radius;
      graphics.lineStyle(4, style.primaryColor, 0.88 - progress * 0.35);
      graphics.strokeCircle(centerX, centerY, blastRadius);
      graphics.lineStyle(2, style.accentColor, 0.95 - progress * 0.45);
      graphics.strokeCircle(centerX, centerY, Math.max(secondaryRadius, blastRadius * 0.52));

      for (let index = 0; index < style.particleCount; index += 1) {
        const angle = (index / style.particleCount) * Math.PI * 2 + progress * 0.6;
        const inner = blastRadius * 0.58;
        const outer = blastRadius * (0.9 + 0.14 * Math.sin(progress * 8 + index));
        graphics.lineStyle(3, index % 2 === 0 ? style.accentColor : style.primaryColor, 0.82 - progress * 0.4);
        graphics.beginPath();
        graphics.moveTo(centerX + Math.cos(angle) * inner, centerY + Math.sin(angle) * inner);
        graphics.lineTo(centerX + Math.cos(angle) * outer, centerY + Math.sin(angle) * outer);
        graphics.strokePath();
      }
      return;
    }

    if (style.kind === 'transport') {
      const beamWidth = this.tileSize * 0.72;
      const beamHeight = this.tileSize * (1.3 + progress * 0.5);
      graphics.fillStyle(style.primaryColor, 0.16 + progress * 0.08);
      graphics.fillRect(centerX - beamWidth / 2, centerY - beamHeight * 0.8, beamWidth, beamHeight);
      graphics.lineStyle(3, style.accentColor, 0.9);
      graphics.strokeCircle(centerX, centerY, radius * 0.78);
      graphics.strokeCircle(centerX, centerY, radius * 1.1);

      for (let index = 0; index < style.particleCount; index += 1) {
        const y = centerY - beamHeight * 0.7 + ((progress * 3.2 + index / style.particleCount) % 1) * beamHeight;
        graphics.fillStyle(style.accentColor, 0.82);
        graphics.fillRect(centerX - beamWidth * 0.32 + (index % 3) * beamWidth * 0.26, y, 3, 3);
      }
      return;
    }

    const fissureRadius = radius;
    graphics.lineStyle(3, style.primaryColor, 0.9 - progress * 0.28);
    for (let index = 0; index < style.particleCount; index += 1) {
      const angle = -Math.PI / 2 + (index - style.particleCount / 2) * 0.28;
      const midRadius = secondaryRadius * (0.8 + (index % 3) * 0.16);
      const outerRadius = fissureRadius * (0.88 + (index % 2) * 0.22);
      graphics.beginPath();
      graphics.moveTo(centerX, centerY);
      graphics.lineTo(centerX + Math.cos(angle) * midRadius, centerY + Math.sin(angle) * midRadius);
      graphics.lineTo(
        centerX + Math.cos(angle + (index % 2 === 0 ? 0.1 : -0.1)) * outerRadius,
        centerY + Math.sin(angle + (index % 2 === 0 ? 0.1 : -0.1)) * outerRadius,
      );
      graphics.strokePath();
    }
    graphics.lineStyle(2, style.accentColor, 0.84 - progress * 0.3);
    graphics.strokeCircle(centerX, centerY, secondaryRadius * 0.72);
  }
}

function getDrillTransientState(
  state: NonNullable<ReturnType<DiggrApp['getState']>>,
): DiggerRenderState | null {
  if (!state.player.activeDrill) {
    return null;
  }

  if (state.player.activeDrill.direction === 'down') {
    return 'drill_down';
  }

  if (state.player.activeDrill.direction === 'left') {
    return 'drill_left';
  }

  return 'drill_right';
}
