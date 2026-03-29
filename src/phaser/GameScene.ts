import Phaser from 'phaser';
import {
  CONSUMABLE_EFFECT_FRAME_SIZE,
  EARTHQUAKE_DURATION_SECONDS,
  EARTHQUAKE_SHAKE_INTENSITY,
  SURFACE_PADS,
  SURFACE_SKY_ROWS,
  TILE_SIZE,
  WORLD_WIDTH,
} from '../config/content';
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
const CONSUMABLE_EFFECT_TEXTURE_KEY = 'consumable-effects';

const DIGGER_TEXTURE_URL = new URL('../assets/sprites/digger-sheet.png', import.meta.url).href;
const SHOP_TEXTURE_URL = new URL('../assets/sprites/surface-shops.png', import.meta.url).href;
const TERRAIN_TEXTURE_URL = new URL('../assets/sprites/terrain-sheet.png', import.meta.url).href;
const CONSUMABLE_EFFECT_TEXTURE_URL = new URL('../assets/sprites/consumable-effects-sheet.png', import.meta.url).href;

export class GameScene extends Phaser.Scene {
  static readonly KEY = 'game-scene';

  private worldGraphics: Phaser.GameObjects.Graphics | null = null;
  private consumableEffectSprite: Phaser.GameObjects.Image | null = null;
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
  private lastHandledEarthquakeId: number | null = null;

  constructor() {
    super(GameScene.KEY);
  }

  preload(): void {
    this.load.spritesheet(TERRAIN_TEXTURE_KEY, TERRAIN_TEXTURE_URL, { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet(DIGGER_TEXTURE_KEY, DIGGER_TEXTURE_URL, { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet(SHOP_TEXTURE_KEY, SHOP_TEXTURE_URL, { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet(CONSUMABLE_EFFECT_TEXTURE_KEY, CONSUMABLE_EFFECT_TEXTURE_URL, {
      frameWidth: CONSUMABLE_EFFECT_FRAME_SIZE,
      frameHeight: CONSUMABLE_EFFECT_FRAME_SIZE,
    });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0e1623');
    this.worldGraphics = this.add.graphics();
    this.consumableEffectSprite = this.add.image(0, 0, CONSUMABLE_EFFECT_TEXTURE_KEY, 0);
    this.consumableEffectSprite.setDepth(2.6);
    this.consumableEffectSprite.setOrigin(0.5, 0.5);
    this.consumableEffectSprite.setVisible(false);
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
      w: Phaser.Input.Keyboard.KeyCodes.W,
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
      viewportBottomRow: (this.cameras.main.worldView.y + this.cameras.main.height) / this.tileSize,
      triggerEarthquake: false,
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

    if (Phaser.Input.Keyboard.JustDown(this.consumableKeys.w)) {
      controls.triggerEarthquake = true;
    }

    const previousHealth = state.player.health;
    const result = app.tick(controls, delta / 1000);
    const nextState = app.getState();
    if (nextState) {
      if (nextState.activeEarthquake && nextState.activeEarthquake.id !== this.lastHandledEarthquakeId) {
        this.cameras.main.shake(EARTHQUAKE_DURATION_SECONDS * 1000, EARTHQUAKE_SHAKE_INTENSITY);
        this.lastHandledEarthquakeId = nextState.activeEarthquake.id;
      } else if (!nextState.activeEarthquake) {
        this.lastHandledEarthquakeId = null;
      }
      this.updateTransientState(nextState, controls, result?.toast, delta / 1000, previousHealth);
    }

    this.renderState(controls);
  }

  private renderState(controls: Pick<ControlState, 'left' | 'right' | 'up' | 'down'>): void {
    const app = this.getApp();
    const state = app.getState();
    if (!state || !this.worldGraphics || !this.playerSprite || !this.consumableEffectSprite) {
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
    graphics.clear();

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
      const effectStyle = getConsumableEffectStyle(consumableEffect);
      const pulse = 0.96 + Math.sin(this.time.now * 0.018) * 0.04;
      this.consumableEffectSprite.setFrame(effectStyle.frame);
      this.consumableEffectSprite.setDisplaySize(
        this.tileSize * effectStyle.widthTiles * pulse,
        this.tileSize * effectStyle.heightTiles * pulse,
      );
      this.consumableEffectSprite.setPosition(
        this.playerSprite.x,
        this.playerSprite.y + this.tileSize * effectStyle.offsetYTiles,
      );
      this.consumableEffectSprite.setAlpha(effectStyle.alpha);
      this.consumableEffectSprite.setVisible(true);
    } else {
      this.consumableEffectSprite.setVisible(false);
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
