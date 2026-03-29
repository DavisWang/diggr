import { SURFACE_PADS } from '../src/config/content';
import {
  getDirectionalDrillErosionRect,
  getDrillMaterialVisualCategory,
  getDrillRigOffset,
  getDrillTerrainFrame,
  getPlayerRenderY,
  getShopRenderLayout,
  getSurfaceGroundFrame,
  getTerrainFrame,
  resolveDiggerRenderState,
} from '../src/phaser/rendering';
import type { GameState } from '../src/types';

function createRenderState(
  overrides: Partial<GameState['player']> = {},
  status: GameState['status'] = 'active',
): Pick<GameState, 'status' | 'player'> {
  return {
    status,
    player: {
      position: { x: 6.5, y: 2.4 },
      velocity: { x: 0, y: 0 },
      health: 100,
      maxHealth: 100,
      fuel: 100,
      maxFuel: 100,
      cash: 0,
      totalEarnings: 0,
      cargoUsed: 0,
      cargoCapacity: 10,
      cargo: {},
      inventory: {
        repair_nanobot: 0,
        repair_microbot: 0,
        small_fuel_tank: 0,
        large_fuel_tank: 0,
        small_tnt: 0,
        large_tnt: 0,
        matter_transporter: 0,
        quantum_fissurizer: 0,
      },
      equipment: {
        drill: 'bronzium',
        hull: 'bronzium',
        cargo_hold: 'bronzium',
        thrusters: 'bronzium',
        fuel_tank: 'bronzium',
        radiator: 'bronzium',
      },
      airborne: false,
      airbornePeakY: 0,
      digCooldown: 0,
      activeDrill: null,
      lastSurfaceZone: null,
      ...overrides,
    },
  };
}

describe('sprite rendering helpers', () => {
  test('hidden lava uses dirt art until discovered', () => {
    expect(getTerrainFrame({ type: 'hidden_lava', discovered: false })).toBe(0);
    expect(getTerrainFrame({ type: 'hidden_lava', discovered: true })).toBe(2);
  });

  test('active drilling resolves hidden lava to the real lava art', () => {
    expect(
      getDrillTerrainFrame({ x: 6, row: 8, progress: 0.35, direction: 'left', blockType: 'hidden_lava' }),
    ).toBe(2);
  });

  test('alien artifact rotates across three deterministic sprite variants', () => {
    const frames = new Set([
      getTerrainFrame({ type: 'alien_artifact', discovered: true }, 2, 7),
      getTerrainFrame({ type: 'alien_artifact', discovered: true }, 3, 7),
      getTerrainFrame({ type: 'alien_artifact', discovered: true }, 4, 7),
      getTerrainFrame({ type: 'alien_artifact', discovered: true }, 5, 7),
      getTerrainFrame({ type: 'alien_artifact', discovered: true }, 6, 7),
    ]);

    expect(frames).toEqual(new Set([11, 12, 13]));
  });

  test('surface offset only applies near the top layer', () => {
    expect(getPlayerRenderY(-0.2)).toBeCloseTo(-0.7, 5);
    expect(getPlayerRenderY(3.4)).toBe(3.4);
  });

  test('shop layout scales proportionally with tile size', () => {
    const small = getShopRenderLayout(SURFACE_PADS[0], 48);
    const large = getShopRenderLayout(SURFACE_PADS[0], 96);

    expect(large.spriteX).toBeCloseTo(small.spriteX * 2, 5);
    expect(large.spriteWidth).toBeCloseTo(small.spriteWidth * 2, 5);
    expect(large.labelY).toBeCloseTo(small.labelY * 2, 5);
  });

  test('surface ground art cycles across the decorative cap frames', () => {
    expect(getSurfaceGroundFrame(0)).toBe(14);
    expect(getSurfaceGroundFrame(1)).toBe(15);
    expect(getSurfaceGroundFrame(2)).toBe(16);
    expect(getSurfaceGroundFrame(3)).toBe(14);
  });

  test('drill material classification maps soft ore and lava correctly', () => {
    expect(getDrillMaterialVisualCategory('dirt')).toBe('soft');
    expect(getDrillMaterialVisualCategory('silverium')).toBe('ore');
    expect(getDrillMaterialVisualCategory('hidden_lava')).toBe('lava');
  });

  test('directional erosion crops blocks from the correct side', () => {
    expect(
      getDirectionalDrillErosionRect({ x: 5, row: 7, progress: 0, direction: 'left', blockType: 'dirt' }),
    ).toEqual({
      visibleLeft: 0,
      visibleTop: 0,
      visibleWidth: 1,
      visibleHeight: 1,
      edge: 'right',
    });

    expect(
      getDirectionalDrillErosionRect({ x: 5, row: 7, progress: 0.25, direction: 'left', blockType: 'dirt' }),
    ).toEqual({
      visibleLeft: 0,
      visibleTop: 0,
      visibleWidth: 0.75,
      visibleHeight: 1,
      edge: 'right',
    });

    expect(
      getDirectionalDrillErosionRect({ x: 5, row: 7, progress: 0.25, direction: 'right', blockType: 'dirt' }),
    ).toEqual({
      visibleLeft: 0.25,
      visibleTop: 0,
      visibleWidth: 0.75,
      visibleHeight: 1,
      edge: 'left',
    });

    expect(
      getDirectionalDrillErosionRect({ x: 5, row: 7, progress: 0.25, direction: 'down', blockType: 'dirt' }),
    ).toEqual({
      visibleLeft: 0,
      visibleTop: 0.25,
      visibleWidth: 1,
      visibleHeight: 0.75,
      edge: 'top',
    });

    expect(
      getDirectionalDrillErosionRect({ x: 5, row: 7, progress: 1, direction: 'down', blockType: 'dirt' }),
    ).toEqual({
      visibleLeft: 0,
      visibleTop: 1,
      visibleWidth: 1,
      visibleHeight: 0,
      edge: 'top',
    });
  });

  test('drill rig offset advances toward the target face as progress increases', () => {
    const playerPosition = { x: 6.5, y: 7.5 };
    const leftStartOffset = getDrillRigOffset(
      { x: 5, row: 7, progress: 0, direction: 'left', blockType: 'dirt' },
      playerPosition,
    );
    const leftLateOffset = getDrillRigOffset(
      { x: 5, row: 7, progress: 0.75, direction: 'left', blockType: 'dirt' },
      playerPosition,
    );
    const rightStartOffset = getDrillRigOffset(
      { x: 7, row: 7, progress: 0, direction: 'right', blockType: 'dirt' },
      playerPosition,
    );
    const rightLateOffset = getDrillRigOffset(
      { x: 7, row: 7, progress: 0.75, direction: 'right', blockType: 'dirt' },
      playerPosition,
    );
    const downStartOffset = getDrillRigOffset({ x: 6, row: 8, progress: 0, direction: 'down', blockType: 'dirt' }, {
      x: 6.2,
      y: 7.5,
    });
    const downLateOffset = getDrillRigOffset({ x: 6, row: 8, progress: 0.75, direction: 'down', blockType: 'dirt' }, {
      x: 6.2,
      y: 7.5,
    });

    expect(leftStartOffset.xTiles).toBeCloseTo(-0.14, 4);
    expect(leftLateOffset.xTiles).toBeCloseTo(-0.89, 4);
    expect(leftLateOffset.xTiles).toBeLessThan(leftStartOffset.xTiles);
    expect(leftLateOffset.yTiles).toBe(0);

    expect(rightStartOffset.xTiles).toBeCloseTo(0.14, 4);
    expect(rightLateOffset.xTiles).toBeCloseTo(0.89, 4);
    expect(rightLateOffset.xTiles).toBeGreaterThan(rightStartOffset.xTiles);
    expect(rightLateOffset.yTiles).toBe(0);

    expect(downStartOffset.xTiles).toBe(0);
    expect(downStartOffset.yTiles).toBeCloseTo(0.06, 4);
    expect(downLateOffset.xTiles).toBeCloseTo(0.225, 4);
    expect(downLateOffset.yTiles).toBeCloseTo(0.81, 4);
    expect(downLateOffset.xTiles).toBeGreaterThan(downStartOffset.xTiles);
    expect(downLateOffset.yTiles).toBeGreaterThan(downStartOffset.yTiles);
  });

  test('resolves idle surface and idle grounded states', () => {
    const idleSurface = resolveDiggerRenderState({
      state: createRenderState({ position: { x: 6.5, y: -0.1 } }),
      controls: { left: false, right: false, up: false, down: false },
      previousFacing: 'right',
    });
    const idleGrounded = resolveDiggerRenderState({
      state: createRenderState(),
      controls: { left: false, right: false, up: false, down: false },
      previousFacing: 'right',
    });

    expect(idleSurface.state).toBe('idle_surface');
    expect(idleGrounded.state).toBe('idle_grounded');
  });

  test('resolves drive, drill, thrust, and falling states', () => {
    const drive = resolveDiggerRenderState({
      state: createRenderState({ velocity: { x: 1.2, y: 0 } }),
      controls: { left: false, right: true, up: false, down: false },
      previousFacing: 'left',
    });
    const drill = resolveDiggerRenderState({
      state: createRenderState(),
      controls: { left: true, right: false, up: false, down: false },
      previousFacing: 'right',
      transientState: 'drill_left',
    });
    const thrust = resolveDiggerRenderState({
      state: createRenderState({ airborne: true, velocity: { x: 0.8, y: -1.4 } }),
      controls: { left: false, right: true, up: true, down: false },
      previousFacing: 'right',
    });
    const falling = resolveDiggerRenderState({
      state: createRenderState({ airborne: true, velocity: { x: 0.3, y: 1.3 } }),
      controls: { left: false, right: false, up: false, down: false },
      previousFacing: 'left',
    });

    expect(drive.state).toBe('drive_right');
    expect(drive.flipX).toBe(true);
    expect(drill.state).toBe('drill_left');
    expect(thrust.state).toBe('thrust_right');
    expect(thrust.flipX).toBe(true);
    expect(falling.state).toBe('falling');
  });

  test('damage and destroyed states override movement-driven animations', () => {
    const damaged = resolveDiggerRenderState({
      state: createRenderState({ velocity: { x: 1.2, y: 0 } }),
      controls: { left: false, right: true, up: false, down: false },
      previousFacing: 'right',
      transientState: 'damaged',
    });
    const destroyed = resolveDiggerRenderState({
      state: createRenderState({}, 'game_over'),
      controls: { left: false, right: true, up: true, down: false },
      previousFacing: 'right',
      transientState: 'damaged',
    });

    expect(damaged.state).toBe('damaged');
    expect(destroyed.state).toBe('destroyed');
  });
});
