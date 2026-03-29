import { BLOCK_DEFS, DRILL_COMPLETION_INSET, PLAYER_HALF_HEIGHT, PLAYER_HALF_WIDTH, SURFACE_RENDER_OFFSET } from '../config/content';
import type { BlockCell, BlockType, ControlState, DrillRenderState, GameState, ShopPad } from '../types';

export type DiggerRenderState =
  | 'idle_surface'
  | 'idle_grounded'
  | 'drive_left'
  | 'drive_right'
  | 'drill_left'
  | 'drill_right'
  | 'drill_down'
  | 'thrust_up'
  | 'thrust_left'
  | 'thrust_right'
  | 'falling'
  | 'damaged'
  | 'destroyed';

export type DiggerFacing = 'left' | 'right';

export interface DiggerAnimationDef {
  key: string;
  frames: number[];
  frameRate: number;
  repeat: number;
}

export const DIGGER_SPRITE_SIZE = {
  widthTiles: 0.92,
  heightTiles: 0.96,
} as const;

export const DIGGER_TRANSIENT_DURATIONS: Readonly<Record<'drill' | 'damaged', number>> = {
  drill: 0.14,
  damaged: 0.18,
};

export const DIGGER_ANIMATIONS: Readonly<Record<string, DiggerAnimationDef>> = {
  idle_surface: { key: 'digger-idle-surface', frames: [0, 1], frameRate: 3, repeat: -1 },
  idle_grounded: { key: 'digger-idle-grounded', frames: [2, 3], frameRate: 4, repeat: -1 },
  drive_left: { key: 'digger-drive-left', frames: [4, 5], frameRate: 10, repeat: -1 },
  drill_left: { key: 'digger-drill-left', frames: [6, 7], frameRate: 14, repeat: -1 },
  drill_down: { key: 'digger-drill-down', frames: [8, 9], frameRate: 14, repeat: -1 },
  thrust_up: { key: 'digger-thrust-up', frames: [10, 11], frameRate: 10, repeat: -1 },
  thrust_left: { key: 'digger-thrust-left', frames: [12, 13], frameRate: 10, repeat: -1 },
  falling: { key: 'digger-falling', frames: [14], frameRate: 1, repeat: -1 },
  damaged: { key: 'digger-damaged', frames: [15], frameRate: 1, repeat: -1 },
  destroyed: { key: 'digger-destroyed', frames: [16], frameRate: 1, repeat: 0 },
};

export interface ResolveDiggerRenderStateInput {
  state: Pick<GameState, 'status' | 'player'>;
  controls: Pick<ControlState, 'left' | 'right' | 'up' | 'down'>;
  previousFacing: DiggerFacing;
  transientState?: DiggerRenderState | null;
}

export interface ResolvedDiggerRenderState {
  state: DiggerRenderState;
  animationKey: string;
  flipX: boolean;
  facing: DiggerFacing;
}

export interface ShopRenderLayout {
  labelX: number;
  labelY: number;
  spriteX: number;
  spriteY: number;
  spriteWidth: number;
  spriteHeight: number;
  fontSize: number;
}

export type DrillMaterialVisualCategory = 'soft' | 'ore' | 'lava';

export interface DrillErosionRect {
  visibleLeft: number;
  visibleTop: number;
  visibleWidth: number;
  visibleHeight: number;
  edge: 'left' | 'right' | 'top' | 'bottom';
}

export interface DrillOverlayStyle {
  fillColor: number;
  fillAlpha: number;
  edgeColor: number;
  edgeAlpha: number;
}

export interface DrillRigOffset {
  xTiles: number;
  yTiles: number;
}

// Rendering helpers stay pure so tests can verify visual geometry without a
// browser or Phaser scene lifecycle. GameScene consumes these values directly.
export function getTerrainFrame(cell: BlockCell, x = 0, row = 0): number | null {
  if (cell.type === 'air') {
    return null;
  }

  if (cell.type === 'hidden_lava') {
    return cell.discovered ? BLOCK_DEFS.lava.spriteFrame : BLOCK_DEFS.dirt.spriteFrame;
  }

  const def = BLOCK_DEFS[cell.type];
  if (!def.spriteVariantFrames || def.spriteVariantFrames.length === 0) {
    return def.spriteFrame;
  }

  const variantIndex = Math.abs(x + row * 7) % def.spriteVariantFrames.length;
  return def.spriteVariantFrames[variantIndex];
}

export function getDrillTerrainFrame(drill: DrillRenderState, x = 0, row = 0): number | null {
  return getTerrainFrame({ type: getVisibleDrillBlockType(drill.blockType), discovered: true }, x, row);
}

export function getDrillMaterialVisualCategory(blockType: BlockType): DrillMaterialVisualCategory {
  const hardness = BLOCK_DEFS[getVisibleDrillBlockType(blockType)].hardness;
  if (hardness === 'lava') {
    return 'lava';
  }

  if (hardness === 'ore') {
    return 'ore';
  }

  return 'soft';
}

export function getDirectionalDrillErosionRect(drill: DrillRenderState): DrillErosionRect {
  const progress = clamp01(drill.progress);
  const remaining = 1 - progress;

  if (drill.direction === 'left') {
    return {
      visibleLeft: 0,
      visibleTop: 0,
      visibleWidth: remaining,
      visibleHeight: 1,
      edge: 'right',
    };
  }

  if (drill.direction === 'right') {
    return {
      visibleLeft: progress,
      visibleTop: 0,
      visibleWidth: remaining,
      visibleHeight: 1,
      edge: 'left',
    };
  }

  return {
    visibleLeft: 0,
    visibleTop: progress,
    visibleWidth: 1,
    visibleHeight: remaining,
    edge: 'top',
  };
}

export function getDrillOverlayStyle(drill: DrillRenderState): DrillOverlayStyle {
  const material = getDrillMaterialVisualCategory(drill.blockType);
  const progress = clamp01(drill.progress);

  if (material === 'lava') {
    return {
      fillColor: 0xff8a36,
      fillAlpha: 0.12 + progress * 0.16,
      edgeColor: 0xffcf66,
      edgeAlpha: 0.72 + progress * 0.2,
    };
  }

  if (material === 'ore') {
    return {
      fillColor: 0xdde9ff,
      fillAlpha: 0.08 + progress * 0.12,
      edgeColor: 0xffffff,
      edgeAlpha: 0.6 + progress * 0.18,
    };
  }

  return {
    fillColor: 0xf0d4a2,
    fillAlpha: 0.06 + progress * 0.1,
    edgeColor: 0xf7e6be,
    edgeAlpha: 0.44 + progress * 0.12,
  };
}

export function getDrillRigOffset(
  drill: DrillRenderState,
  playerPosition: Pick<GameState['player']['position'], 'x' | 'y'>,
): DrillRigOffset {
  const erosion = getDirectionalDrillErosionRect(drill);

  if (drill.direction === 'left') {
    // Align against the live erosion edge rather than a guessed animation curve.
    const contactX = drill.x + erosion.visibleLeft + erosion.visibleWidth;
    const alignedCenterX = contactX + PLAYER_HALF_WIDTH + DRILL_COMPLETION_INSET;
    return {
      xTiles: alignedCenterX - playerPosition.x,
      yTiles: 0,
    };
  }

  if (drill.direction === 'right') {
    const contactX = drill.x + erosion.visibleLeft;
    const alignedCenterX = contactX - PLAYER_HALF_WIDTH - DRILL_COMPLETION_INSET;
    return {
      xTiles: alignedCenterX - playerPosition.x,
      yTiles: 0,
    };
  }

  const contactY = drill.row + erosion.visibleTop;
  const alignedCenterY = contactY - PLAYER_HALF_HEIGHT - DRILL_COMPLETION_INSET;
  return {
    xTiles: 0,
    yTiles: alignedCenterY - playerPosition.y,
  };
}

export function getPlayerRenderY(positionY: number): number {
  // The surface strip is drawn as a decorative cap above row 0, so the rig
  // needs a small render-only lift while it is still in the surface zone.
  return positionY < 0.25 ? positionY - SURFACE_RENDER_OFFSET : positionY;
}

export function getShopRenderLayout(pad: ShopPad, tileSize: number): ShopRenderLayout {
  return {
    labelX: pad.x * tileSize,
    labelY: (pad.y + pad.labelOffsetY) * tileSize,
    spriteX: pad.x * tileSize,
    spriteY: (pad.y + pad.spriteOffsetY) * tileSize,
    spriteWidth: pad.spriteWidthTiles * tileSize,
    spriteHeight: pad.spriteHeightTiles * tileSize,
    fontSize: Math.max(12, Math.round(tileSize * 0.24)),
  };
}

export function resolveDiggerRenderState(input: ResolveDiggerRenderStateInput): ResolvedDiggerRenderState {
  const facing = resolveFacing(input);

  if (input.state.status === 'game_over') {
    return buildResolvedState('destroyed', facing);
  }

  if (input.transientState) {
    return buildResolvedState(input.transientState, facing);
  }

  if (input.controls.up && input.state.player.velocity.y < -0.05) {
    if (input.controls.left && !input.controls.right) {
      return buildResolvedState('thrust_left', 'left');
    }

    if (input.controls.right && !input.controls.left) {
      return buildResolvedState('thrust_right', 'right');
    }

    return buildResolvedState('thrust_up', facing);
  }

  if (input.state.player.airborne && input.state.player.velocity.y > 0.35) {
    return buildResolvedState('falling', facing);
  }

  if (!input.state.player.airborne && Math.abs(input.state.player.velocity.x) > 0.35) {
    return buildResolvedState(facing === 'left' ? 'drive_left' : 'drive_right', facing);
  }

  if (input.state.player.position.y < 0.25) {
    return buildResolvedState('idle_surface', facing);
  }

  return buildResolvedState('idle_grounded', facing);
}

function resolveFacing(input: ResolveDiggerRenderStateInput): DiggerFacing {
  if (input.controls.left && !input.controls.right) {
    return 'left';
  }

  if (input.controls.right && !input.controls.left) {
    return 'right';
  }

  if (input.state.player.velocity.x < -0.2) {
    return 'left';
  }

  if (input.state.player.velocity.x > 0.2) {
    return 'right';
  }

  return input.previousFacing;
}

function buildResolvedState(state: DiggerRenderState, facing: DiggerFacing): ResolvedDiggerRenderState {
  const canonicalState = getCanonicalAnimationState(state);
  const animation = DIGGER_ANIMATIONS[canonicalState];

  return {
    state,
    animationKey: animation.key,
    flipX: state === 'drive_right' || state === 'drill_right' || state === 'thrust_right',
    facing,
  };
}

function getCanonicalAnimationState(state: DiggerRenderState): keyof typeof DIGGER_ANIMATIONS {
  if (state === 'drive_right') {
    return 'drive_left';
  }

  if (state === 'drill_right') {
    return 'drill_left';
  }

  if (state === 'thrust_right') {
    return 'thrust_left';
  }

  return state;
}

function getVisibleDrillBlockType(blockType: BlockType): BlockType {
  return blockType === 'hidden_lava' ? 'lava' : blockType;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
