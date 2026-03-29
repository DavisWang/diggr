import { BLOCK_DEFS, PHYSICS, STORAGE_KEY, UPGRADE_TIER_DEFS } from '../src/config/content';
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

  test('testing mode boosts health fuel and spending freedom', () => {
    const state = createNewGame(1000, { testingMode: true });

    expect(state.meta.testingMode).toBe(true);
    expect(state.player.maxHealth).toBe(10000);
    expect(state.player.maxFuel).toBe(10000);
    expect(state.player.cash).toBeGreaterThanOrEqual(999999);
    expect(state.player.inventory.repair_nanobot).toBe(100);
    expect(state.player.inventory.repair_microbot).toBe(100);
    expect(state.player.inventory.small_fuel_tank).toBe(100);
    expect(state.player.inventory.large_fuel_tank).toBe(100);
    expect(state.player.inventory.small_tnt).toBe(100);
    expect(state.player.inventory.large_tnt).toBe(100);
    expect(state.player.inventory.matter_transporter).toBe(100);
    expect(state.player.inventory.quantum_fissurizer).toBe(100);

    const startingCash = state.player.cash;
    const message = buyConsumable(state, 'large_tnt');

    expect(message).toContain('Inventory cap reached');
    expect(state.player.inventory.large_tnt).toBe(100);
    expect(state.player.cash).toBe(startingCash);
  });

  test('blocks digging downward into the first surface layer', () => {
    const state = createNewGame(1001);
    state.player.position = { x: 6.5, y: -0.2 };
    setCell(state.world, 6, 0, 'dirt');

    const result = attemptDig(state, 'down', state.player.equipment.drill, true);

    expect(result).toContain('first surface layer');
    expect(getCell(state.world, 6, 0).type).toBe('dirt');
  });

  test('requires a better drill when the ore is more than one tier above the current drill', () => {
    const state = createNewGame(1002);
    state.player.position = { x: 6.5, y: 2.2 };
    setCell(state.world, 6, 2, 'goldium_ore');

    const result = attemptDig(state, 'left', 'bronzium', true);

    expect(result).toContain('better drill');
    expect(getCell(state.world, 6, 2).type).toBe('goldium_ore');
  });

  test('one-tier-under drills can mine the next ore tier with slower speed and higher fuel burn', () => {
    const state = createNewGame(1002);
    state.player.position = { x: 6.5, y: 2.2 };
    setCell(state.world, 6, 2, 'silverium');
    const startingFuel = state.player.fuel;

    const result = attemptDig(state, 'left', 'bronzium', true);

    expect(result).toContain('Overclock-drilling Silverium');
    expect(state.player.activeDrill).not.toBeNull();
    expect(state.player.activeDrill!.totalSeconds).toBeGreaterThan(calculateDrillDurationSeconds('silverium', 'silverium'));
    expect(startingFuel - state.player.fuel).toBeGreaterThan(PHYSICS.digFuelBase + BLOCK_DEFS.silverium.value / 42);

    advanceDrill(state);

    expect(getCell(state.world, 6, 2).type).toBe('air');
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
    expect(state.player.position.y).toBeCloseTo(2.2, 4);
    expect(state.player.velocity.x).toBe(0);
    expect(getCell(state.world, 5, 2).type).toBe('air');
  });

  test('downward drill completion recenters the digger into the opened tile from an edge-biased start', () => {
    const state = createNewGame(1003);
    state.player.position = { x: 6.18, y: 1.7 };
    setCell(state.world, 6, 2, 'tinnite');

    attemptDig(state, 'down', state.player.equipment.drill, true);
    advanceDrill(state);

    expect(state.player.position.x).toBeCloseTo(6.5, 4);
    expect(state.player.position.y).toBeCloseTo(2.56, 4);
    expect(getCell(state.world, 6, 2).type).toBe('air');
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

  test('allows mining with a full cargo hold and discards the ore', () => {
    const state = createNewGame(1004);
    state.player.position = { x: 6.5, y: 2.2 };
    state.player.cargoCapacity = 1;
    state.player.cargoUsed = 1;
    setCell(state.world, 6, 2, 'tinnite');

    const result = attemptDig(state, 'left', state.player.equipment.drill, true);

    expect(result).toContain('Drilling Tinnite');
    advanceDrill(state);

    expect(getCell(state.world, 6, 2).type).toBe('air');
    expect(state.player.cargoUsed).toBe(1);
    expect(state.player.cargo.tinnite ?? 0).toBe(0);
    expect(state.toast).toContain('discarded');
  });

  test('higher value blocks take longer to drill and better drills reduce duration', () => {
    expect(calculateDrillDurationSeconds('runite_ore', 'bronzium')).toBeGreaterThan(
      calculateDrillDurationSeconds('tinnite', 'bronzium'),
    );
    expect(calculateDrillDurationSeconds('goldium_ore', 'goldium')).toBeLessThan(
      calculateDrillDurationSeconds('goldium_ore', 'bronzium'),
    );
    expect(calculateDrillDurationSeconds('silverium', 'bronzium', 'overclocked')).toBeGreaterThan(
      calculateDrillDurationSeconds('silverium', 'silverium'),
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

  test('fall damage is reduced or negated when impact speed is softened before landing', () => {
    expect(calculateFallDamage(100, 30, 3)).toBe(0);
    expect(calculateFallDamage(100, 30, 5)).toBeLessThan(30);
    expect(calculateFallDamage(100, 30, 9.5)).toBeCloseTo(80, 5);
  });

  test('landing damage only applies on the real airborne touchdown, not on later grounded ticks', () => {
    const state = createNewGame(1018, { testingMode: true });
    state.player.position = { x: 6.5, y: 20.58 };
    state.player.airborne = true;
    state.player.airbornePeakY = 0.5;
    state.player.velocity = { x: 0, y: 9.5 };
    setCell(state.world, 6, 21, 'dirt');
    const startingHealth = state.player.health;

    tickGame(state, { left: false, right: false, up: true, down: false, consume: [] }, 0.1);
    const healthAfterLanding = state.player.health;

    expect(healthAfterLanding).toBeGreaterThan(startingHealth - 8000);

    tickGame(state, { left: false, right: false, up: false, down: false, consume: [] }, 0.1);

    expect(state.player.health).toBe(healthAfterLanding);
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

  test('TNT cannot destroy the protected first surface layer', () => {
    const state = createNewGame(1008);
    state.player.position = { x: 6.5, y: 1.4 };
    state.player.inventory.large_tnt = 1;
    setCell(state.world, 5, 0, 'dirt');
    setCell(state.world, 6, 0, 'bronzium_ore');
    setCell(state.world, 7, 0, 'rock');

    useConsumable(state, 'large_tnt');

    expect(getCell(state.world, 5, 0).type).toBe('dirt');
    expect(getCell(state.world, 6, 0).type).toBe('bronzium_ore');
    expect(getCell(state.world, 7, 0).type).toBe('rock');
  });

  test('teleport consumables obey their destination rules', () => {
    const state = createNewGame(1009);
    state.player.position = { x: 6.5, y: 22.5 };
    state.player.inventory.matter_transporter = 1;
    state.player.inventory.quantum_fissurizer = 1;

    expect(useConsumable(state, 'matter_transporter')).toContain('surface');
    expect(state.player.position.y).toBeLessThan(0);
    expect(state.player.position.x).toBeCloseTo(9.8, 1);

    const afterTransport = tickGame(
      state,
      { left: false, right: false, up: false, down: false, consume: [] },
      0.016,
    );
    expect(afterTransport.openedShop).toBeNull();

    useConsumable(state, 'quantum_fissurizer');
    expect(state.player.position.y).toBeLessThan(0);
    expect(Math.abs(state.player.velocity.x) + Math.abs(state.player.velocity.y)).toBeGreaterThan(0);
  });

  test('quantum fissurizer suppresses surface shop entry until the digger fully stops', () => {
    const state = createNewGame(1010);
    state.player.inventory.quantum_fissurizer = 1;

    useConsumable(state, 'quantum_fissurizer');
    state.player.position = { x: 8.3, y: -0.4 };
    state.player.velocity = { x: 1.8, y: 0.6 };

    const movingTick = tickGame(
      state,
      { left: false, right: false, up: false, down: false, consume: [] },
      0.016,
    );
    expect(movingTick.openedShop).toBeNull();
    expect(state.blockSurfaceShopsUntilStop).toBe(true);

    state.player.position = { x: 8.3, y: -0.4 };
    state.player.velocity = { x: 0, y: 0 };
    state.player.airborne = false;

    const settledTick = tickGame(
      state,
      { left: false, right: false, up: false, down: false, consume: [] },
      0.016,
    );
    expect(state.blockSurfaceShopsUntilStop).toBe(false);
    expect(settledTick.openedShop).toBe('refinery');
  });

  test('using consumables starts a visual effect state that later expires', () => {
    const state = createNewGame(1042);
    state.player.inventory.repair_nanobot = 1;
    state.player.inventory.large_fuel_tank = 1;
    state.player.inventory.large_tnt = 1;
    state.player.inventory.matter_transporter = 1;
    state.player.inventory.quantum_fissurizer = 1;

    useConsumable(state, 'repair_nanobot');
    expect(state.activeConsumableEffect?.type).toBe('repair_nanobot');

    useConsumable(state, 'large_fuel_tank');
    expect(state.activeConsumableEffect?.type).toBe('large_fuel_tank');

    useConsumable(state, 'large_tnt');
    expect(state.activeConsumableEffect?.type).toBe('large_tnt');

    useConsumable(state, 'matter_transporter');
    expect(state.activeConsumableEffect?.type).toBe('matter_transporter');

    useConsumable(state, 'quantum_fissurizer');
    expect(state.activeConsumableEffect?.type).toBe('quantum_fissurizer');

    tickGame(state, { left: false, right: false, up: false, down: false, consume: [] }, 1.2);
    expect(state.activeConsumableEffect).toBeNull();
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

  test('late-game upgrade prices match the moderate rebalance table', () => {
    expect(UPGRADE_TIER_DEFS.drill.adamantium.price).toBe(1350);
    expect(UPGRADE_TIER_DEFS.drill.runite.price).toBe(2000);
    expect(UPGRADE_TIER_DEFS.hull.adamantium.price).toBe(1100);
    expect(UPGRADE_TIER_DEFS.hull.runite.price).toBe(1600);
    expect(UPGRADE_TIER_DEFS.cargo_hold.adamantium.price).toBe(920);
    expect(UPGRADE_TIER_DEFS.cargo_hold.runite.price).toBe(1350);
    expect(UPGRADE_TIER_DEFS.thrusters.adamantium.price).toBe(1100);
    expect(UPGRADE_TIER_DEFS.thrusters.runite.price).toBe(1600);
    expect(UPGRADE_TIER_DEFS.fuel_tank.adamantium.price).toBe(930);
    expect(UPGRADE_TIER_DEFS.fuel_tank.runite.price).toBe(1380);
    expect(UPGRADE_TIER_DEFS.radiator.adamantium.price).toBe(1100);
    expect(UPGRADE_TIER_DEFS.radiator.runite.price).toBe(1600);
  });

  test('late-game upgrade purchases respect the new higher price thresholds', () => {
    const state = createNewGame(1019);
    state.player.cash = 939;

    expect(buyUpgrade(state, 'hull', 'adamantium')).toContain('Not enough cash');
    expect(state.player.equipment.hull).toBe('bronzium');

    state.player.cash = 1100;
    expect(buyUpgrade(state, 'hull', 'adamantium')).toContain('installed');
    expect(state.player.equipment.hull).toBe('adamantium');

    state.player.cash = 1599;
    expect(buyUpgrade(state, 'thrusters', 'runite')).toContain('Not enough cash');
    expect(state.player.equipment.thrusters).toBe('bronzium');

    state.player.cash = 1600;
    expect(buyUpgrade(state, 'thrusters', 'runite')).toContain('installed');
    expect(state.player.equipment.thrusters).toBe('runite');
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
