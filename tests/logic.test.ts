import { STORAGE_KEY } from '../src/config/content';
import {
  attemptDig,
  buyConsumable,
  buyUpgrade,
  calculateDrillDurationSeconds,
  calculateFallDamage,
  computeServiceCost,
  createNewGame,
  getDrillRenderState,
  openShop,
  repairAndRefuel,
  restoreGame,
  sellAllCargo,
  tickGame,
  useConsumable,
} from '../src/game/logic';
import { setCell, getCell } from '../src/game/world';
import { loadState, persistState } from '../src/lib/storage';

describe('game rules', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('blocks sideways digging on the top layer', () => {
    const state = createNewGame(1001);
    state.player.position = { x: 6.5, y: 0.5 };
    setCell(state.world, 5, 0, 'dirt');

    const result = attemptDig(state, 'left', state.player.equipment.drill, true);

    expect(result).toContain('first surface layer');
    expect(getCell(state.world, 5, 0).type).toBe('dirt');
  });

  test('blocks digging downward into the first surface layer', () => {
    const state = createNewGame(1001);
    state.player.position = { x: 6.5, y: -0.2 };
    setCell(state.world, 6, 0, 'dirt');

    const result = attemptDig(state, 'down', state.player.equipment.drill, true);

    expect(result).toContain('first surface layer');
    expect(getCell(state.world, 6, 0).type).toBe('dirt');
  });

  test('requires a better drill for higher tier ore', () => {
    const state = createNewGame(1002);
    state.player.position = { x: 6.5, y: 2.2 };
    setCell(state.world, 6, 2, 'silverium');

    const result = attemptDig(state, 'left', 'bronzium', true);

    expect(result).toContain('better drill');
    expect(getCell(state.world, 6, 2).type).toBe('silverium');
  });

  test('starting a valid drill keeps the block intact until completion', () => {
    const state = createNewGame(1003);
    state.player.position = { x: 6.5, y: 2.2 };
    setCell(state.world, 6, 2, 'tinnite');

    const result = attemptDig(state, 'left', state.player.equipment.drill, true);

    expect(result).toContain('Drilling Tinnite');
    expect(state.player.activeDrill).not.toBeNull();
    expect(getCell(state.world, 6, 2).type).toBe('tinnite');
    expect(getDrillRenderState(state.player)?.progress).toBe(0);
    expect(getDrillRenderState(state.player)?.blockType).toBe('tinnite');

    advanceDrill(state);

    expect(state.player.activeDrill).toBeNull();
    expect(getCell(state.world, 6, 2).type).toBe('air');
    expect(getDrillRenderState(state.player)).toBeNull();
  });

  test('drill completion moves the digger into the mined space instead of snapping back', () => {
    const state = createNewGame(1003);
    state.player.position = { x: 6.2, y: 2.2 };
    setCell(state.world, 5, 2, 'tinnite');
    setCell(state.world, 6, 2, 'air');

    attemptDig(state, 'left', state.player.equipment.drill, true);
    advanceDrill(state);

    expect(state.player.position.x).toBeCloseTo(5.36, 4);
    expect(state.player.velocity.x).toBe(0);
    expect(getCell(state.world, 5, 2).type).toBe('air');
  });

  test('applies lava damage and clears the mined block after the timed drill completes', () => {
    const state = createNewGame(1003);
    state.player.position = { x: 6.5, y: 2.2 };
    setCell(state.world, 6, 2, 'lava');
    const startingHealth = state.player.health;

    const result = attemptDig(state, 'left', state.player.equipment.drill, true);

    expect(result).toContain('Drilling Molten Lava');
    advanceDrill(state);

    expect(state.player.health).toBeLessThan(startingHealth);
    expect(getCell(state.world, 6, 2).type).toBe('air');
  });

  test('prevents mining when the cargo hold is full', () => {
    const state = createNewGame(1004);
    state.player.position = { x: 6.5, y: 2.2 };
    state.player.cargoCapacity = 1;
    state.player.cargoUsed = 1;
    setCell(state.world, 6, 2, 'tinnite');

    const result = attemptDig(state, 'left', state.player.equipment.drill, true);

    expect(result).toContain('Cargo hold is full');
    expect(getCell(state.world, 6, 2).type).toBe('tinnite');
  });

  test('higher value blocks take longer to drill and better drills reduce duration', () => {
    expect(calculateDrillDurationSeconds('runite_ore', 'bronzium')).toBeGreaterThan(
      calculateDrillDurationSeconds('tinnite', 'bronzium'),
    );
    expect(calculateDrillDurationSeconds('goldium_ore', 'goldium')).toBeLessThan(
      calculateDrillDurationSeconds('goldium_ore', 'bronzium'),
    );
  });

  test('fuel is charged upfront and not recharged or recharged again on completion', () => {
    const state = createNewGame(1005);
    state.player.position = { x: 6.5, y: 2.2 };
    setCell(state.world, 6, 2, 'tinnite');
    const startingFuel = state.player.fuel;

    attemptDig(state, 'left', state.player.equipment.drill, true);

    const fuelAfterStart = state.player.fuel;
    expect(fuelAfterStart).toBeLessThan(startingFuel);

    advanceDrill(state);

    expect(state.player.fuel).toBe(fuelAfterStart);
  });

  test('once drilling starts movement input cannot interrupt or redirect it', () => {
    const state = createNewGame(1005);
    state.player.position = { x: 6.5, y: 2.2 };
    state.player.velocity = { x: 2, y: 0 };
    setCell(state.world, 6, 2, 'tinnite');

    attemptDig(state, 'left', state.player.equipment.drill, true);
    const drillTarget = { ...state.player.activeDrill! };

    tickGame(state, { left: false, right: true, up: true, down: false, consume: [] }, drillTarget.remainingSeconds * 0.5);

    expect(state.player.activeDrill).not.toBeNull();
    expect(state.player.activeDrill?.x).toBe(drillTarget.x);
    expect(state.player.activeDrill?.row).toBe(drillTarget.row);
    expect(state.player.velocity.x).toBe(0);
    expect(state.player.velocity.y).toBe(0);

    advanceDrill(state);

    expect(state.player.activeDrill).toBeNull();
    expect(getCell(state.world, drillTarget.x, drillTarget.row).type).toBe('air');
  });

  test('cannot start a drill without enough fuel', () => {
    const state = createNewGame(1006);
    state.player.position = { x: 6.5, y: 2.2 };
    state.player.fuel = 0;
    setCell(state.world, 6, 2, 'tinnite');

    const result = attemptDig(state, 'left', state.player.equipment.drill, true);

    expect(result).toContain('Not enough fuel');
    expect(state.player.activeDrill).toBeNull();
    expect(getCell(state.world, 6, 2).type).toBe('tinnite');
  });

  test('teleport effects cancel an in-progress drill and leave the target block intact', () => {
    const state = createNewGame(1007);
    state.player.position = { x: 6.5, y: 22.5 };
    state.player.inventory.matter_transporter = 1;
    setCell(state.world, 6, 22, 'tinnite');

    attemptDig(state, 'left', state.player.equipment.drill, true);
    expect(state.player.activeDrill).not.toBeNull();

    useConsumable(state, 'matter_transporter');

    expect(state.player.activeDrill).toBeNull();
    expect(getCell(state.world, 6, 22).type).toBe('tinnite');
  });

  test('cargo weight reduces mobility and increases fuel burn', () => {
    const light = createNewGame(1005);
    const heavy = createNewGame(1005);
    heavy.player.cargo.goldium_ore = heavy.player.cargoCapacity;
    heavy.player.cargoUsed = heavy.player.cargoCapacity;

    tickGame(light, { left: false, right: true, up: true, down: false, consume: [] }, 0.2);
    tickGame(heavy, { left: false, right: true, up: true, down: false, consume: [] }, 0.2);

    expect(light.player.velocity.x).toBeGreaterThan(heavy.player.velocity.x);
    expect(light.player.fuel).toBeGreaterThan(heavy.player.fuel);
  });

  test('the digger can still take off under full cargo with weak thrusters', () => {
    const state = createNewGame(1010);
    state.player.position = { x: 5.5, y: 8.58 };
    state.player.cargo.goldium_ore = state.player.cargoCapacity;
    state.player.cargoUsed = state.player.cargoCapacity;
    setCell(state.world, 5, 7, 'air');
    setCell(state.world, 5, 8, 'air');
    setCell(state.world, 5, 9, 'dirt');

    const startY = state.player.position.y;
    for (let index = 0; index < 12; index += 1) {
      tickGame(state, { left: false, right: false, up: true, down: false, consume: [] }, 0.1);
    }

    expect(state.player.position.y).toBeLessThan(startY);
  });

  test('movement input dismisses shop windows after a longer grace delay', () => {
    const state = createNewGame(1011);
    state.player.position = { x: 8.3, y: -1.35 };
    openShop(state, 'refinery');

    tickGame(state, { left: true, right: false, up: false, down: false, consume: [] }, 0.016);

    expect(state.mode).toBe('modal');
    expect(state.modal.type).toBe('refinery');

    tickGame(state, { left: true, right: false, up: false, down: false, consume: [] }, 1.6);

    expect(state.mode).toBe('gameplay');
    expect(state.modal.type).toBe('none');
    expect(state.blockedShopUntilExit).toBe('refinery');
  });

  test('inventory toggles with q without affecting shop exit gating', () => {
    const state = createNewGame(1014);

    tickGame(
      state,
      { left: false, right: false, up: false, down: false, consume: [], toggleInventory: true },
      0.016,
    );

    expect(state.mode).toBe('modal');
    expect(state.modal.type).toBe('inventory');

    tickGame(
      state,
      { left: false, right: false, up: false, down: false, consume: [], toggleInventory: true },
      0.016,
    );

    expect(state.mode).toBe('gameplay');
    expect(state.modal.type).toBe('none');
    expect(state.blockedShopUntilExit).toBeNull();
  });

  test('shop trigger is forgiving when the digger approaches close to a shop', () => {
    const state = createNewGame(1012);
    state.player.position = { x: 8.9, y: -0.45 };
    state.player.velocity = { x: 2.8, y: 0.7 };

    const result = tickGame(state, { left: false, right: false, up: false, down: false, consume: [] }, 0.016);

    expect(result.openedShop).toBe('refinery');
    expect(state.mode).toBe('modal');
    expect(state.modal.type).toBe('refinery');
  });

  test('starting position does not immediately trigger a shop', () => {
    const state = createNewGame(1013);

    const result = tickGame(state, { left: false, right: false, up: false, down: false, consume: [] }, 0.016);

    expect(result.openedShop).toBeNull();
    expect(state.mode).toBe('gameplay');
    expect(state.player.lastSurfaceZone).toBeNull();
  });

  test('fall damage starts around 10 blocks and caps at 80 percent health by 30 blocks', () => {
    expect(calculateFallDamage(100, 9.9)).toBe(0);
    expect(calculateFallDamage(100, 10)).toBe(0);
    expect(calculateFallDamage(100, 20)).toBeCloseTo(40, 5);
    expect(calculateFallDamage(100, 30)).toBeCloseTo(80, 5);
    expect(calculateFallDamage(100, 45)).toBeCloseTo(80, 5);
  });

  test('blocked upward thrust does not spend fuel', () => {
    const state = createNewGame(1015);
    state.player.position = { x: 6.5, y: 5.42 };
    setCell(state.world, 6, 4, 'rock');
    setCell(state.world, 6, 5, 'air');
    const startingFuel = state.player.fuel;
    const startingY = state.player.position.y;

    for (let index = 0; index < 5; index += 1) {
      tickGame(state, { left: false, right: false, up: true, down: false, consume: [] }, 0.1);
    }

    expect(state.player.fuel).toBe(startingFuel);
    expect(state.player.position.y).toBeCloseTo(startingY, 4);
  });

  test('small TNT clears nearby rock in a 3x3 area', () => {
    const state = createNewGame(1008);
    state.player.position = { x: 6.5, y: 6.5 };
    state.player.inventory.small_tnt = 1;

    for (let row = 5; row <= 7; row += 1) {
      for (let col = 5; col <= 7; col += 1) {
        setCell(state.world, col, row, 'rock');
      }
    }

    useConsumable(state, 'small_tnt');

    for (let row = 5; row <= 7; row += 1) {
      for (let col = 5; col <= 7; col += 1) {
        expect(getCell(state.world, col, row).type).toBe('air');
      }
    }
  });

  test('teleport consumables obey their destination rules', () => {
    const state = createNewGame(1009);
    state.player.position = { x: 6.5, y: 22.5 };
    state.player.inventory.matter_transporter = 1;
    state.player.inventory.quantum_fissurizer = 1;

    useConsumable(state, 'matter_transporter');
    expect(state.player.position.y).toBeLessThan(0);
    expect(state.player.position.x).toBeGreaterThan(9);

    useConsumable(state, 'quantum_fissurizer');
    expect(state.player.position.y).toBeLessThan(0);
    expect(Math.abs(state.player.velocity.x) + Math.abs(state.player.velocity.y)).toBeGreaterThan(0);
  });

  test('shop actions update money, inventory, and player stats', () => {
    const state = createNewGame(1016);
    state.player.cash = 2000;
    state.player.cargo.tinnite = 3;
    state.player.cargoUsed = 3;
    state.player.health = 40;
    state.player.fuel = 15;

    expect(buyConsumable(state, 'repair_microbot')).toContain('added');
    expect(state.player.inventory.repair_microbot).toBe(1);

    expect(buyUpgrade(state, 'hull', 'silverium')).toContain('installed');
    expect(state.player.maxHealth).toBeGreaterThan(100);

    expect(sellAllCargo(state)?.total).toBeGreaterThan(0);
    expect(state.player.cargoUsed).toBe(0);

    const serviceCost = computeServiceCost(state);
    expect(serviceCost).toBeGreaterThan(0);
    expect(repairAndRefuel(state)).toContain('serviced');
    expect(state.player.health).toBe(state.player.maxHealth);
    expect(state.player.fuel).toBe(state.player.maxFuel);
  });

  test('save and load restore the current game state including an in-progress drill', () => {
    const state = createNewGame(1017);
    state.player.position = { x: 6.5, y: 2.2 };
    state.player.cash = 777;
    state.player.inventory.small_tnt = 4;
    state.player.cargo.silverium = 2;
    state.player.cargoUsed = 2;
    setCell(state.world, 6, 2, 'tinnite');
    attemptDig(state, 'left', state.player.equipment.drill, true);

    persistState(state);
    const loaded = loadState();

    expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy();
    expect(loaded).not.toBeNull();
    const restored = restoreGame(loaded!);
    expect(restored.player.cash).toBe(777);
    expect(restored.player.inventory.small_tnt).toBe(4);
    expect(restored.player.cargo.silverium).toBe(2);
    expect(restored.player.activeDrill).not.toBeNull();

    advanceDrill(restored);
    expect(getCell(restored.world, 6, 2).type).toBe('air');
  });
});

function advanceDrill(state: ReturnType<typeof createNewGame>): void {
  const remaining = state.player.activeDrill?.remainingSeconds ?? 0;
  tickGame(state, { left: false, right: false, up: false, down: false, consume: [] }, remaining + 0.05);
}
