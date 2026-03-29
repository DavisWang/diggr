import {
  BLOCK_DEFS,
  CONSUMABLE_DEFS,
  CONSUMABLE_TYPES,
  EARTHQUAKE_DURATION_SECONDS,
  EARTHQUAKE_SHOP_CLOSE_CHANCE,
  ENTRY_COLUMN,
  DRILL_COMPLETION_INSET,
  EQUIPMENT_TIERS,
  HOW_TO_COPY,
  PHYSICS,
  PLAYER_HALF_HEIGHT,
  PLAYER_HALF_WIDTH,
  PLAYER_START_CASH,
  SAVE_VERSION,
  SHOP_MOVEMENT_DISMISS_GRACE_SECONDS,
  SURFACE_PADS,
  SURFACE_SKY_ROWS,
  TELEPORT_SURFACE_TARGET,
  TESTING_MAX_FUEL,
  TESTING_MAX_HEALTH,
  TESTING_START_CASH,
  UPGRADE_TIER_DEFS,
  WORLD_WIDTH,
  getTierIndex,
} from '../config/content';
import { clamp, hashSeed, mulberry32, randomInt } from '../lib/random';
import {
  canDrillTierMine,
  createWorld,
  discoverCell,
  ensureRows,
  getDrillMiningMode,
  getCell,
  isDestructibleType,
  isSolidType,
  regenerateWorldBelowRow,
  setCell,
} from './world';
import type { DrillMiningMode } from './world';
import type {
  ActiveDrillState,
  ActiveConsumableEffectState,
  BlockType,
  ConsumableType,
  ControlState,
  Direction,
  DrillRenderState,
  EquipmentLevels,
  EquipmentTier,
  GameState,
  InventoryState,
  ModalState,
  PlayerState,
  SellableMaterial,
  ShopPad,
  ShopType,
  TickResult,
  UpgradeTierDef,
  UpgradeType,
  Vector2,
} from '../types';

// logic.ts is the gameplay source of truth. Phaser feeds it input and time, but
// all mine generation, survival rules, economy updates, and modal state changes
// happen here so saves and tests stay deterministic.
export function createNewGame(seed = Date.now(), options: { testingMode?: boolean } = {}): GameState {
  const world = createWorld(seed);
  ensureRows(world, 0, 120);
  const testingMode = Boolean(options.testingMode);

  const player = createPlayer(testingMode);
  syncPlayerDerived(player, testingMode);

  return {
    status: 'active',
    mode: 'gameplay',
    modal: { type: 'none' },
    modalDismissGraceRemaining: 0,
    activeConsumableEffect: null,
    activeEarthquake: null,
    world,
    player,
    meta: {
      version: SAVE_VERSION,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      hasVisitedUnderground: false,
      testingMode,
      shopCloseCount: 0,
      earthquakeCount: 0,
    },
    toast: testingMode ? 'Testing mode active. Fuel, hull, and cash are boosted for sandbox runs.' : 'Dig down, sell ore, and upgrade the rig.',
    blockedShopUntilExit: null,
    blockSurfaceShopsUntilStop: false,
    viewportBottomRow: 0,
  };
}

export function restoreGame(state: GameState): GameState {
  normalizeSaveStationResumeState(state);
  state.modalDismissGraceRemaining = state.modalDismissGraceRemaining ?? 0;
  state.activeConsumableEffect = state.activeConsumableEffect ?? null;
  state.activeEarthquake = state.activeEarthquake ?? null;
  state.blockSurfaceShopsUntilStop = Boolean(state.blockSurfaceShopsUntilStop);
  state.viewportBottomRow = Math.max(0, Math.floor(state.viewportBottomRow ?? 0));
  state.player.activeDrill = state.player.activeDrill ?? null;
  state.meta.testingMode = Boolean(state.meta.testingMode);
  state.meta.shopCloseCount = state.meta.shopCloseCount ?? 0;
  state.meta.earthquakeCount = state.meta.earthquakeCount ?? 0;
  syncPlayerDerived(state.player, state.meta.testingMode);
  ensureRows(state.world, 0, Math.max(120, Math.ceil(state.player.position.y) + 40));
  return state;
}

export function tickGame(state: GameState, controls: ControlState, dtSeconds: number): TickResult {
  const result: TickResult = {
    surfaceReturn: false,
    gameOver: false,
    openedShop: null,
  };

  if (state.status === 'game_over') {
    state.activeConsumableEffect = null;
    state.player.velocity.x *= 0.85;
    state.player.velocity.y *= 0.85;
    return result;
  }

  if (controls.viewportBottomRow !== undefined) {
    state.viewportBottomRow = Math.max(0, Math.floor(controls.viewportBottomRow));
  }

  if (controls.triggerEarthquake && state.meta.testingMode && state.mode === 'gameplay') {
    startEarthquake(state, 'manual');
  }

  if (state.activeEarthquake) {
    tickActiveEarthquake(state, dtSeconds);
    return result;
  }

  if (controls.toggleInventory) {
    if (state.mode === 'modal' && state.modal.type === 'inventory') {
      closeModal(state);
      return result;
    }

    if (state.mode === 'gameplay') {
      cancelActiveDrill(state);
      state.modal = { type: 'inventory' };
      state.mode = 'modal';
      state.modalDismissGraceRemaining = 0;
      return result;
    }
  }

  if (state.mode === 'modal') {
    cancelActiveDrill(state);
    state.modalDismissGraceRemaining = Math.max(0, state.modalDismissGraceRemaining - dtSeconds);
    if (
      isDismissibleShopModal(state.modal.type) &&
      hasMovementIntent(controls) &&
      state.modalDismissGraceRemaining <= 0
    ) {
      closeModal(state);
      if (state.activeEarthquake) {
        tickActiveEarthquake(state, dtSeconds);
        return result;
      }
    } else {
      state.player.velocity.x *= 0.85;
      state.player.velocity.y *= 0.85;
      return result;
    }
  }

  const previousDepth = getCurrentDepth(state.player.position);
  const previousAboveSurface = isAboveSurface(state.player.position.y);
  ensureRows(state.world, previousDepth - 4, previousDepth + 36);

  const groundedBefore = isGrounded(state);
  const wasStillMovingForSurfaceShopLock =
    Math.abs(state.player.velocity.x) >= 0.08 ||
    Math.abs(state.player.velocity.y) >= 0.08 ||
    state.player.airborne ||
    !groundedBefore;
  if (!groundedBefore && !state.player.airborne) {
    state.player.airborne = true;
    state.player.airbornePeakY = state.player.position.y;
  }

  if (state.player.airborne) {
    state.player.airbornePeakY = Math.min(state.player.airbornePeakY, state.player.position.y);
  }

  for (const consumable of controls.consume) {
    const consumed = useConsumable(state, consumable);
    if (consumed) {
      result.toast = consumed;
    }
  }

  const completedDrill = updateActiveDrill(state, dtSeconds);
  if (completedDrill) {
    result.toast = completedDrill;
  }

  const stats = getDerivedStats(state.player);
  const cargoRatio = state.player.cargoCapacity > 0 ? state.player.cargoUsed / state.player.cargoCapacity : 0;
  const weightFactor = 1 + (cargoRatio * PHYSICS.cargoWeightPenalty) / stats.lift;
  // Timed drilling is a committed action: once the player starts it, movement
  // input should no longer redirect the rig until the block resolves.
  const drillingLocked = Boolean(state.player.activeDrill);

  const horizontalIntent = Number(controls.right) - Number(controls.left);

  if (!drillingLocked && horizontalIntent !== 0) {
    {
      const direction: Direction = horizontalIntent < 0 ? 'left' : 'right';
      const dug = attemptDig(state, direction, stats.drillTier, groundedBefore);

      if (!dug) {
        state.player.velocity.x += (horizontalIntent * PHYSICS.horizontalThrust * dtSeconds) / weightFactor;
      } else {
        result.toast = dug;
      }
    }
  } else if (!drillingLocked) {
    applyHorizontalDrag(state.player, groundedBefore, dtSeconds);
  }

  if (!drillingLocked && controls.down) {
    const dugDown = attemptDig(state, 'down', stats.drillTier, groundedBefore);
    if (dugDown) {
      result.toast = dugDown;
    }
  }

  const blockedAboveWhileThrusting =
    !drillingLocked && controls.up && collidesAt(state, state.player.position.x, state.player.position.y - 0.06);

  if (blockedAboveWhileThrusting) {
    state.player.velocity.y = 0;
  } else if (!drillingLocked && controls.up && state.player.fuel > 0) {
    const liftRatio = Math.max(PHYSICS.minimumTakeoffRatio, stats.lift / weightFactor);
    state.player.velocity.y -= PHYSICS.verticalThrust * liftRatio * dtSeconds;
    spendFuel(state.player, PHYSICS.flightFuelPerSecond * weightFactor * dtSeconds);
  }

  if (!drillingLocked && Math.abs(state.player.velocity.x) > 0.08 && groundedBefore) {
    spendFuel(state.player, PHYSICS.movementFuelPerSecond * weightFactor * dtSeconds);
  }

  const currentDepth = getCurrentDepth(state.player.position);
  if (currentDepth > 0) {
    state.meta.hasVisitedUnderground = true;
  }

  if (currentDepth > stats.safeDepth) {
    const overDepth = currentDepth - stats.safeDepth;
    damagePlayer(state.player, (PHYSICS.ambientHeatPerSecond + overDepth * 0.03) * dtSeconds, 'Heat is building up.');
  }

  if (drillingLocked) {
    state.player.velocity = { x: 0, y: 0 };
    state.player.airborne = false;
    state.player.airbornePeakY = state.player.position.y;
  } else {
    state.player.velocity.x = clamp(
      state.player.velocity.x,
      -PHYSICS.maxHorizontalSpeed * stats.lift,
      PHYSICS.maxHorizontalSpeed * stats.lift,
    );
    state.player.velocity.y = clamp(state.player.velocity.y, -PHYSICS.maxVerticalSpeed, PHYSICS.maxVerticalSpeed);
    state.player.velocity.y += PHYSICS.gravity * dtSeconds;
    if (blockedAboveWhileThrusting) {
      state.player.velocity.y = 0;
    }

    movePlayer(state, dtSeconds);
  }

  const groundedAfter = isGrounded(state);
  if (groundedAfter) {
    state.player.airborne = false;
  }

  const nowAboveSurface = isAboveSurface(state.player.position.y);
  if (!previousAboveSurface && nowAboveSurface && state.meta.hasVisitedUnderground) {
    result.surfaceReturn = true;
    state.meta.hasVisitedUnderground = false;
    result.toast = result.toast ?? 'Surface reached. Shops and refinery are available.';
  }

  if (
    state.blockSurfaceShopsUntilStop &&
    nowAboveSurface &&
    groundedAfter &&
    !wasStillMovingForSurfaceShopLock &&
    Math.abs(state.player.velocity.x) < 0.08 &&
    Math.abs(state.player.velocity.y) < 0.08
  ) {
    state.blockSurfaceShopsUntilStop = false;
  }

  const shop = findShopAtPosition(state.player.position);
  state.player.lastSurfaceZone = shop?.shop ?? null;
  if (!shop && state.blockedShopUntilExit) {
    state.blockedShopUntilExit = null;
  }

  if (
    shop &&
    state.mode === 'gameplay' &&
    !state.blockSurfaceShopsUntilStop &&
    state.blockedShopUntilExit !== shop.shop &&
    nowAboveSurface &&
    Math.abs(state.player.velocity.x) < 3.4 &&
    Math.abs(state.player.velocity.y) < 2.2
  ) {
    openShop(state, shop.shop);
    result.openedShop = shop.shop;
  }

  if (state.player.health <= 0 || state.player.fuel <= 0) {
    cancelActiveDrill(state);
    state.activeConsumableEffect = null;
    state.status = 'game_over';
    state.mode = 'modal';
    state.modal = {
      type: 'game_over',
      message: state.player.health <= 0 ? 'Hull integrity failed.' : 'Fuel depleted.',
    };
    state.toast = null;
    result.gameOver = true;
  } else {
    state.toast = result.toast ?? state.toast;
  }

  updateConsumableEffect(state, dtSeconds);

  return result;
}

export function openShop(state: GameState, shop: ShopType): void {
  const modal: ModalState = {
    type: shop,
  };

  if (shop === 'upgrades') {
    modal.selectedCategory = 'hull';
    modal.selectedId = `${modal.selectedCategory}:silverium`;
  }

  if (shop === 'consumables') {
    modal.selectedId = CONSUMABLE_TYPES[0];
  }

  state.modal = modal;
  state.mode = 'modal';
  state.modalDismissGraceRemaining = SHOP_MOVEMENT_DISMISS_GRACE_SECONDS;
  state.toast = null;
}

export function closeModal(state: GameState): void {
  const closingModalType = state.modal.type;
  if (isDismissibleShopModal(closingModalType)) {
    state.blockedShopUntilExit = closingModalType;
  }

  state.modal = { type: 'none' };
  state.modalDismissGraceRemaining = 0;
  state.mode = state.status === 'game_over' ? 'modal' : 'gameplay';
  maybeTriggerEarthquake(state, closingModalType);
}

export function getDerivedStats(player: PlayerState): {
  drillTier: EquipmentTier;
  digSpeed: number;
  lift: number;
  safeDepth: number;
  lavaMitigation: number;
} {
  return {
    drillTier: player.equipment.drill,
    digSpeed: UPGRADE_TIER_DEFS.drill[player.equipment.drill].digSpeed ?? 1,
    lift: UPGRADE_TIER_DEFS.thrusters[player.equipment.thrusters].statValue,
    safeDepth: UPGRADE_TIER_DEFS.radiator[player.equipment.radiator].safeDepth ?? 24,
    lavaMitigation: UPGRADE_TIER_DEFS.radiator[player.equipment.radiator].lavaMitigation ?? 0,
  };
}

export function syncPlayerDerived(player: PlayerState, testingMode = false): void {
  player.maxHealth = UPGRADE_TIER_DEFS.hull[player.equipment.hull].statValue;
  player.maxFuel = UPGRADE_TIER_DEFS.fuel_tank[player.equipment.fuel_tank].statValue;
  player.cargoCapacity = UPGRADE_TIER_DEFS.cargo_hold[player.equipment.cargo_hold].statValue;

  if (testingMode) {
    player.maxHealth = TESTING_MAX_HEALTH;
    player.maxFuel = TESTING_MAX_FUEL;
    player.cash = Math.max(player.cash, TESTING_START_CASH);
  }

  player.health = Math.min(player.health, player.maxHealth);
  player.fuel = Math.min(player.fuel, player.maxFuel);
  player.cargoUsed = getCargoUsed(player.cargo);
}

export function setUpgradeSelection(state: GameState, category: UpgradeType, tier: EquipmentTier): void {
  state.modal.selectedCategory = category;
  state.modal.selectedId = `${category}:${tier}`;
}

export function setConsumableSelection(state: GameState, consumable: ConsumableType): void {
  state.modal.selectedId = consumable;
}

export function getUpgradeChoices(state: GameState, category: UpgradeType): UpgradeTierDef[] {
  const currentIndex = getTierIndex(state.player.equipment[category]);
  return EQUIPMENT_TIERS.slice(currentIndex + 1).map((tier) => UPGRADE_TIER_DEFS[category][tier]);
}

export function buyUpgrade(state: GameState, category: UpgradeType, tier: EquipmentTier): string | null {
  const currentTier = state.player.equipment[category];
  if (getTierIndex(tier) <= getTierIndex(currentTier)) {
    return 'Already installed.';
  }

  const def = UPGRADE_TIER_DEFS[category][tier];
  if (state.player.cash < def.price) {
    return 'Not enough cash for that upgrade.';
  }

  if (!state.meta.testingMode) {
    state.player.cash -= def.price;
  }
  state.player.equipment[category] = tier;
  syncPlayerDerived(state.player, state.meta.testingMode);
  state.toast = `${def.label} installed.`;
  return state.toast;
}

export function buyConsumable(state: GameState, type: ConsumableType): string | null {
  const def = CONSUMABLE_DEFS[type];
  if (state.player.cash < def.price) {
    return 'Not enough cash for that item.';
  }

  if (state.player.inventory[type] >= 99) {
    return 'Inventory cap reached for that item.';
  }

  if (!state.meta.testingMode) {
    state.player.cash -= def.price;
  }
  state.player.inventory[type] += 1;
  state.toast = `${def.label} added to inventory.`;
  return state.toast;
}

export function sellAllCargo(state: GameState): { total: number; message: string } | null {
  let total = 0;

  for (const [type, count] of Object.entries(state.player.cargo) as [SellableMaterial, number][]) {
    total += (BLOCK_DEFS[type].value ?? 0) * count;
  }

  if (total <= 0) {
    return null;
  }

  state.player.cash += total;
  state.player.totalEarnings += total;
  state.player.cargo = {};
  state.player.cargoUsed = 0;
  const message = `Sold cargo for $${total}.`;
  state.toast = message;
  return { total, message };
}

export function getCargoEntries(state: GameState): Array<{ type: SellableMaterial; label: string; amount: number; subtotal: number }> {
  return Object.entries(state.player.cargo)
    .filter(([, amount]) => amount > 0)
    .map(([type, amount]) => ({
      type: type as SellableMaterial,
      label: BLOCK_DEFS[type as SellableMaterial].label,
      amount,
      subtotal: BLOCK_DEFS[type as SellableMaterial].value * amount,
    }));
}

export function computeServiceCost(state: GameState): number {
  const missingHealth = Math.max(0, state.player.maxHealth - state.player.health);
  const missingFuel = Math.max(0, state.player.maxFuel - state.player.fuel);
  if (missingHealth <= 0 && missingFuel <= 0) {
    return 0;
  }

  return Math.ceil(12 + missingHealth * 0.35 + missingFuel * 0.18);
}

export function repairAndRefuel(state: GameState): string | null {
  const cost = computeServiceCost(state);
  if (cost <= 0) {
    return 'The rig is already fully serviced.';
  }

  if (state.player.cash < cost) {
    return 'Not enough cash to repair and refuel.';
  }

  if (!state.meta.testingMode) {
    state.player.cash -= cost;
  }
  state.player.health = state.player.maxHealth;
  state.player.fuel = state.player.maxFuel;
  state.toast = `Rig serviced for $${cost}.`;
  return state.toast;
}

export function useConsumable(state: GameState, type: ConsumableType): string | null {
  if (state.player.inventory[type] <= 0) {
    return null;
  }

  state.player.inventory[type] -= 1;
  triggerConsumableEffect(state, type);

  switch (type) {
    case 'repair_nanobot':
      state.player.health = Math.min(state.player.maxHealth, state.player.health + 28);
      return 'Repair Nanobot restored hull integrity.';
    case 'repair_microbot':
      state.player.health = Math.min(state.player.maxHealth, state.player.health + 64);
      return 'Repair Microbot restored major hull integrity.';
    case 'small_fuel_tank':
      state.player.fuel = Math.min(state.player.maxFuel, state.player.fuel + 42);
      return 'Small Fuel Tank restored fuel.';
    case 'large_fuel_tank':
      state.player.fuel = Math.min(state.player.maxFuel, state.player.fuel + 84);
      return 'Large Fuel Tank restored fuel.';
    case 'small_tnt':
      cancelActiveDrill(state);
      blastRadius(state, 1);
      return 'Small TNT cleared a 3x3 area.';
    case 'large_tnt':
      cancelActiveDrill(state);
      blastRadius(state, 2);
      return 'Large TNT cleared a 5x5 area.';
    case 'matter_transporter':
      cancelActiveDrill(state);
      state.blockSurfaceShopsUntilStop = false;
      state.player.position = { ...TELEPORT_SURFACE_TARGET };
      state.player.velocity = { x: 0, y: 0 };
      return 'Matter Transporter moved the rig to the surface.';
    case 'quantum_fissurizer': {
      cancelActiveDrill(state);
      state.blockSurfaceShopsUntilStop = true;
      const random = mulberry32(hashSeed(state.world.seed, Math.floor(state.player.position.y) + 999));
      state.player.position = {
        x: randomInt(random, 1, WORLD_WIDTH - 2) + 0.5,
        y: -randomInt(random, 1, 3),
      };
      state.player.velocity = {
        x: (random() * 2 - 1) * 5,
        y: -random() * 5,
      };
      return 'Quantum Fissurizer launched the rig above ground.';
    }
    default:
      return null;
  }
}

function triggerConsumableEffect(state: GameState, type: ConsumableType): void {
  state.activeConsumableEffect = {
    type,
    totalSeconds: getConsumableEffectDuration(type),
    remainingSeconds: getConsumableEffectDuration(type),
  };
}

function updateConsumableEffect(state: GameState, dtSeconds: number): void {
  const effect = state.activeConsumableEffect;
  if (!effect) {
    return;
  }

  effect.remainingSeconds = Math.max(0, effect.remainingSeconds - dtSeconds);
  if (effect.remainingSeconds <= 0) {
    state.activeConsumableEffect = null;
  }
}

function tickActiveEarthquake(state: GameState, dtSeconds: number): void {
  const earthquake = state.activeEarthquake;
  if (!earthquake) {
    return;
  }

  state.player.velocity = { x: 0, y: 0 };
  state.player.airborne = false;
  state.player.airbornePeakY = state.player.position.y;
  earthquake.remainingSeconds = Math.max(0, earthquake.remainingSeconds - dtSeconds);

  if (earthquake.remainingSeconds <= 0) {
    state.activeEarthquake = null;
    state.toast = 'The tremors settle.';
  }
}

function maybeTriggerEarthquake(state: GameState, closedModalType: ModalState['type']): void {
  if (!isDismissibleShopModal(closedModalType)) {
    return;
  }

  const closeIndex = state.meta.shopCloseCount ?? 0;
  state.meta.shopCloseCount = closeIndex + 1;
  const random = mulberry32(hashSeed(state.world.seed, 7_113 + closeIndex));
  if (random() > EARTHQUAKE_SHOP_CLOSE_CHANCE) {
    return;
  }

  startEarthquake(state, 'shop_close');
}

function startEarthquake(state: GameState, trigger: 'manual' | 'shop_close'): void {
  if (state.activeEarthquake) {
    return;
  }

  const regenerateFromRow = Math.max(1, Math.floor(state.viewportBottomRow) + 1);
  regenerateWorldBelowRow(state.world, regenerateFromRow);
  state.meta.earthquakeCount = (state.meta.earthquakeCount ?? 0) + 1;
  state.activeEarthquake = {
    id: state.meta.earthquakeCount,
    remainingSeconds: EARTHQUAKE_DURATION_SECONDS,
    totalSeconds: EARTHQUAKE_DURATION_SECONDS,
    regenerateFromRow,
  };
  state.toast =
    trigger === 'manual'
      ? 'Testing earthquake triggered.'
      : 'Earthquake! The mine has shifted below you.';
}

function getConsumableEffectDuration(type: ConsumableType): number {
  switch (type) {
    case 'repair_nanobot':
      return 0.55;
    case 'repair_microbot':
      return 0.8;
    case 'small_fuel_tank':
      return 0.5;
    case 'large_fuel_tank':
      return 0.72;
    case 'small_tnt':
      return 0.46;
    case 'large_tnt':
      return 0.62;
    case 'matter_transporter':
      return 0.84;
    case 'quantum_fissurizer':
      return 0.92;
    default:
      return 0.6;
  }
}

export function getConsumableEffectRenderState(
  activeEffect: ActiveConsumableEffectState | null,
): { type: ConsumableType; progress: number } | null {
  if (!activeEffect) {
    return null;
  }

  return {
    type: activeEffect.type,
    progress: clamp(1 - activeEffect.remainingSeconds / activeEffect.totalSeconds, 0, 1),
  };
}

export function getSelectedUpgrade(state: GameState): UpgradeTierDef | null {
  const category = state.modal.selectedCategory;
  const selectedId = state.modal.selectedId;
  if (!category || !selectedId) {
    return null;
  }

  const [, tier] = selectedId.split(':');
  if (!tier || !EQUIPMENT_TIERS.includes(tier as EquipmentTier)) {
    return null;
  }

  return UPGRADE_TIER_DEFS[category][tier as EquipmentTier];
}

export function getHowToCopy(): string[] {
  return HOW_TO_COPY;
}

export function getCurrentDepth(position: Vector2): number {
  return Math.max(0, Math.floor(position.y));
}

export function getPlayerCargoRatio(player: PlayerState): number {
  return player.cargoCapacity > 0 ? player.cargoUsed / player.cargoCapacity : 0;
}

export function getDrillRenderState(player: PlayerState): DrillRenderState | null {
  if (!player.activeDrill) {
    return null;
  }

  return {
    x: player.activeDrill.x,
    row: player.activeDrill.row,
    direction: player.activeDrill.direction,
    blockType: player.activeDrill.blockType,
    progress: clamp(1 - player.activeDrill.remainingSeconds / player.activeDrill.totalSeconds, 0, 1),
  };
}

export function calculateDrillDurationSeconds(
  blockType: BlockType,
  drillTier: EquipmentTier,
  miningMode: DrillMiningMode = 'native',
): number {
  const block = BLOCK_DEFS[blockType];
  const hardnessSeconds =
    block.hardness === 'soft'
      ? 0.04
      : block.hardness === 'ore'
        ? 0.18
        : block.hardness === 'lava'
          ? 0.32
          : 0;
  const digSpeed = UPGRADE_TIER_DEFS.drill[drillTier].digSpeed ?? 1;
  const modeMultiplier = miningMode === 'overclocked' ? PHYSICS.overtierDrillTimeMultiplier : 1;
  return Math.max(
    0.18,
    ((PHYSICS.digTimeBaseSeconds + hardnessSeconds + block.value * PHYSICS.digTimeValueFactorSeconds) * modeMultiplier) /
      digSpeed,
  );
}

export function calculateFallDamage(maxHealth: number, fallDistance: number, impactSpeed = PHYSICS.fallDamageFullImpactSpeed): number {
  if (fallDistance <= PHYSICS.fallDamageStartDistance) {
    return 0;
  }

  if (impactSpeed <= PHYSICS.fallDamageSafeImpactSpeed) {
    return 0;
  }

  const normalizedDistance = clamp(
    (fallDistance - PHYSICS.fallDamageStartDistance) /
      (PHYSICS.fallDamageMaxDistance - PHYSICS.fallDamageStartDistance),
    0,
    1,
  );
  const normalizedImpact = clamp(
    (impactSpeed - PHYSICS.fallDamageSafeImpactSpeed) /
      (PHYSICS.fallDamageFullImpactSpeed - PHYSICS.fallDamageSafeImpactSpeed),
    0,
    1,
  );

  return maxHealth * PHYSICS.fallDamageMaxHealthFraction * normalizedDistance * normalizedImpact;
}

export function findShopAtPosition(position: Vector2): ShopPad | null {
  if (!isAboveSurface(position.y)) {
    return null;
  }

  return (
    SURFACE_PADS.find(
      (pad) => Math.abs(position.x - pad.x) <= pad.width / 2 + 0.2 && Math.abs(position.y - pad.y) <= 1.05,
    ) ?? null
  );
}

function createPlayer(testingMode = false): PlayerState {
  const equipment = createEquipment();
  const inventory = createInventory(testingMode);

  return {
    position: { x: ENTRY_COLUMN - PLAYER_HALF_WIDTH - 0.04, y: -PLAYER_HALF_HEIGHT - 0.02 },
    velocity: { x: 0, y: 0 },
    health: testingMode ? TESTING_MAX_HEALTH : UPGRADE_TIER_DEFS.hull[equipment.hull].statValue,
    maxHealth: testingMode ? TESTING_MAX_HEALTH : UPGRADE_TIER_DEFS.hull[equipment.hull].statValue,
    fuel: testingMode ? TESTING_MAX_FUEL : UPGRADE_TIER_DEFS.fuel_tank[equipment.fuel_tank].statValue,
    maxFuel: testingMode ? TESTING_MAX_FUEL : UPGRADE_TIER_DEFS.fuel_tank[equipment.fuel_tank].statValue,
    cash: testingMode ? TESTING_START_CASH : PLAYER_START_CASH,
    totalEarnings: 0,
    cargoUsed: 0,
    cargoCapacity: UPGRADE_TIER_DEFS.cargo_hold[equipment.cargo_hold].statValue,
    cargo: {},
    inventory,
    equipment,
    airborne: false,
    airbornePeakY: 0,
    digCooldown: 0,
    activeDrill: null,
    lastSurfaceZone: null,
  };
}

function createEquipment(): EquipmentLevels {
  return {
    drill: 'bronzium',
    hull: 'bronzium',
    cargo_hold: 'bronzium',
    thrusters: 'bronzium',
    fuel_tank: 'bronzium',
    radiator: 'bronzium',
  };
}

function createInventory(testingMode = false): InventoryState {
  if (testingMode) {
    return {
      repair_nanobot: 100,
      repair_microbot: 100,
      small_fuel_tank: 100,
      large_fuel_tank: 100,
      small_tnt: 100,
      large_tnt: 100,
      matter_transporter: 100,
      quantum_fissurizer: 100,
    };
  }

  return {
    repair_nanobot: 1,
    repair_microbot: 0,
    small_fuel_tank: 1,
    large_fuel_tank: 0,
    small_tnt: 1,
    large_tnt: 0,
    matter_transporter: 0,
    quantum_fissurizer: 0,
  };
}

export function attemptDig(
  state: GameState,
  direction: Direction,
  drillTier: EquipmentTier,
  grounded: boolean,
): string | null {
  if (state.player.activeDrill || !grounded) {
    return null;
  }

  const target = getDigTarget(state.player.position, direction);
  if (!target) {
    return null;
  }

  if (target.row === 0) {
    return 'Cannot dig the first surface layer.';
  }

  const cell = getCell(state.world, target.x, target.row);
  if (!isSolidType(cell.type) || !isDestructibleType(cell.type)) {
    return null;
  }

  const block = BLOCK_DEFS[cell.type];
  const miningMode = getDrillMiningMode(block.requiredDrill, drillTier);
  if (!canDrillTierMine(block.requiredDrill, drillTier)) {
    return `${block.label} needs a better drill.`;
  }

  const fuelCost =
    (PHYSICS.digFuelBase + block.value / 42) *
    (miningMode === 'overclocked' ? PHYSICS.overtierDrillFuelMultiplier : 1);
  if (state.player.fuel < fuelCost) {
    return 'Not enough fuel to start the drill.';
  }

  spendFuel(state.player, fuelCost);
  state.player.activeDrill = {
    x: target.x,
    row: target.row,
    direction,
    blockType: cell.type,
    fuelCost,
    remainingSeconds: calculateDrillDurationSeconds(cell.type, drillTier, miningMode),
    totalSeconds: calculateDrillDurationSeconds(cell.type, drillTier, miningMode),
  };
  state.player.velocity = { x: 0, y: 0 };
  state.player.airborne = false;
  state.player.airbornePeakY = state.player.position.y;
  return miningMode === 'overclocked' ? `Overclock-drilling ${block.label}...` : `Drilling ${block.label}...`;
}

function getDigTarget(position: Vector2, direction: Direction): { x: number; row: number } | null {
  const row = Math.floor(position.y);
  const centerColumn = Math.floor(position.x);

  if (direction === 'left') {
    return { x: Math.floor(position.x - PLAYER_HALF_WIDTH - 0.06), row };
  }

  if (direction === 'right') {
    return { x: Math.floor(position.x + PLAYER_HALF_WIDTH + 0.06), row };
  }

  if (direction === 'down') {
    return { x: centerColumn, row: Math.floor(position.y + PLAYER_HALF_HEIGHT + 0.06) };
  }

  return null;
}

function addToCargo(player: PlayerState, type: SellableMaterial, amount: number): void {
  player.cargo[type] = (player.cargo[type] ?? 0) + amount;
  player.cargoUsed = getCargoUsed(player.cargo);
}

function updateActiveDrill(state: GameState, dtSeconds: number): string | null {
  const drill = state.player.activeDrill;
  if (!drill) {
    return null;
  }

  if (!isActiveDrillValid(state, drill)) {
    cancelActiveDrill(state);
    return null;
  }

  drill.remainingSeconds = Math.max(0, drill.remainingSeconds - dtSeconds);
  if (drill.remainingSeconds > 0) {
    return null;
  }

  return resolveActiveDrill(state);
}

function resolveActiveDrill(state: GameState): string | null {
  const drill = state.player.activeDrill;
  if (!drill) {
    return null;
  }

  const cell = getCell(state.world, drill.x, drill.row);
  if (cell.type !== drill.blockType || !isSolidType(cell.type) || !isDestructibleType(cell.type)) {
    cancelActiveDrill(state);
    return null;
  }

  const block = BLOCK_DEFS[cell.type];
  state.player.activeDrill = null;
  setCell(state.world, drill.x, drill.row, 'air');
  discoverCell(state.world, drill.x, drill.row);
  // The render layer animates the rig toward this destination while drilling.
  // Completing the drill commits that visual move into actual gameplay state.
  movePlayerIntoResolvedDrillSpace(state, drill);

  if (block.hazardDamage) {
    const damage = block.hazardDamage * (1 - getDerivedStats(state.player).lavaMitigation);
    damagePlayer(state.player, damage, `${block.label} scorched the hull.`);
  }

  if (block.immediateCash) {
    state.player.cash += block.value;
    state.player.totalEarnings += block.value;
    return `${block.label} sold instantly for $${block.value}.`;
  }

  if (block.cargo > 0) {
    if (state.player.cargoUsed + block.cargo <= state.player.cargoCapacity) {
      addToCargo(state.player, cell.type as SellableMaterial, block.cargo);
      return `Mined ${block.label}.`;
    }

    return `Mined ${block.label}, but the cargo hold was full so it was discarded.`;
  }

  return `Mined ${block.label}.`;
}

function isActiveDrillValid(state: GameState, drill: ActiveDrillState): boolean {
  const cell = getCell(state.world, drill.x, drill.row);
  return cell.type === drill.blockType && isSolidType(cell.type) && isDestructibleType(cell.type);
}

function cancelActiveDrill(state: GameState): void {
  state.player.activeDrill = null;
}

function movePlayerIntoResolvedDrillSpace(state: GameState, drill: ActiveDrillState): void {
  const settledRowY = drill.row + 1 - PLAYER_HALF_HEIGHT - DRILL_COMPLETION_INSET;
  if (drill.direction === 'left' || drill.direction === 'right') {
    state.player.position = {
      x:
        drill.direction === 'left'
          ? drill.x + PLAYER_HALF_WIDTH + DRILL_COMPLETION_INSET
          : drill.x + 1 - PLAYER_HALF_WIDTH - DRILL_COMPLETION_INSET,
      y: state.player.position.y,
    };
  } else {
    state.player.position = { x: drill.x + 0.5, y: settledRowY };
  }

  state.player.velocity = { x: 0, y: 0 };
  state.player.airborne = false;
  state.player.airbornePeakY = state.player.position.y;
}

function blastRadius(state: GameState, radius: number): void {
  const centerX = Math.floor(state.player.position.x);
  const centerRow = Math.floor(state.player.position.y);

  for (let row = centerRow - radius; row <= centerRow + radius; row += 1) {
    for (let x = centerX - radius; x <= centerX + radius; x += 1) {
      if (x < 0 || x >= WORLD_WIDTH || row < 0 || row === 0) {
        continue;
      }

      const cell = getCell(state.world, x, row);
      if (cell.type === 'rock' || isDestructibleType(cell.type)) {
        setCell(state.world, x, row, 'air');
        discoverCell(state.world, x, row);
      }
    }
  }
}

function getCargoUsed(cargo: PlayerState['cargo']): number {
  return Object.entries(cargo).reduce((total, [type, amount]) => total + BLOCK_DEFS[type as SellableMaterial].cargo * amount, 0);
}

function spendFuel(player: PlayerState, amount: number): void {
  player.fuel = Math.max(0, player.fuel - amount);
}

function damagePlayer(player: PlayerState, amount: number, _message: string): void {
  player.health = Math.max(0, player.health - amount);
}

function applyHorizontalDrag(player: PlayerState, grounded: boolean, dtSeconds: number): void {
  const drag = grounded ? PHYSICS.dragGround : PHYSICS.dragAir;
  const dragAmount = drag * dtSeconds;
  if (player.velocity.x > 0) {
    player.velocity.x = Math.max(0, player.velocity.x - dragAmount);
  } else if (player.velocity.x < 0) {
    player.velocity.x = Math.min(0, player.velocity.x + dragAmount);
  }
}

function movePlayer(state: GameState, dtSeconds: number): void {
  const desiredDx = state.player.velocity.x * dtSeconds;
  const desiredDy = state.player.velocity.y * dtSeconds;
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(desiredDx), Math.abs(desiredDy)) * 10));
  const stepX = desiredDx / steps;
  const stepY = desiredDy / steps;
  let allowX = stepX !== 0;
  let allowY = stepY !== 0;

  for (let index = 0; index < steps; index += 1) {
    if (allowX) {
      const nextX = state.player.position.x + stepX;
      if (!collidesAt(state, nextX, state.player.position.y)) {
        state.player.position.x = nextX;
      } else {
        state.player.velocity.x = 0;
        allowX = false;
      }
    }

    if (allowY) {
      const nextY = state.player.position.y + stepY;
      if (!collidesAt(state, state.player.position.x, nextY)) {
        state.player.position.y = nextY;
      } else {
        if (stepY > 0 && state.player.airborne) {
          const fallDistance = state.player.position.y - state.player.airbornePeakY;
          const damage = calculateFallDamage(state.player.maxHealth, fallDistance, Math.max(0, state.player.velocity.y));
          if (damage > 0) {
            damagePlayer(state.player, damage, 'Heavy landing.');
          }
          state.player.airborne = false;
          state.player.airbornePeakY = state.player.position.y;
        }
        state.player.velocity.y = 0;
        allowY = false;
      }
    }
  }

  state.player.position.x = clamp(
    state.player.position.x,
    PLAYER_HALF_WIDTH,
    WORLD_WIDTH - PLAYER_HALF_WIDTH,
  );
  state.player.position.y = Math.max(state.player.position.y, -SURFACE_SKY_ROWS + PLAYER_HALF_HEIGHT);
}

function collidesAt(state: GameState, x: number, y: number): boolean {
  const minX = x - PLAYER_HALF_WIDTH;
  const maxX = x + PLAYER_HALF_WIDTH;
  const minY = y - PLAYER_HALF_HEIGHT;
  const maxY = y + PLAYER_HALF_HEIGHT;

  if (minY < 0) {
    return solidInRect(state, minX, maxX, 0, maxY);
  }

  return solidInRect(state, minX, maxX, minY, maxY);
}

function solidInRect(state: GameState, minX: number, maxX: number, minY: number, maxY: number): boolean {
  const startCol = Math.floor(minX);
  const endCol = Math.floor(maxX);
  const startRow = Math.floor(minY);
  const endRow = Math.floor(maxY);

  ensureRows(state.world, startRow, endRow + 2);

  for (let row = startRow; row <= endRow; row += 1) {
    for (let col = startCol; col <= endCol; col += 1) {
      if (col < 0 || col >= WORLD_WIDTH || row < 0) {
        continue;
      }

      const cell = getCell(state.world, col, row);
      if (isSolidType(cell.type)) {
        return true;
      }
    }
  }

  return false;
}

function isGrounded(state: GameState): boolean {
  return collidesAt(state, state.player.position.x, state.player.position.y + 0.06);
}

function isAboveSurface(y: number): boolean {
  return y < 0.25;
}

function hasMovementIntent(controls: ControlState): boolean {
  return controls.left || controls.right || controls.up || controls.down;
}

function isDismissibleShopModal(modalType: ModalState['type']): modalType is ShopType {
  return modalType === 'upgrades' || modalType === 'consumables' || modalType === 'refinery' || modalType === 'service' || modalType === 'save';
}

function normalizeSaveStationResumeState(state: GameState): void {
  if (state.modal.type !== 'save' && state.blockedShopUntilExit !== 'save') {
    return;
  }

  const savePad = SURFACE_PADS.find((pad) => pad.shop === 'save');
  state.mode = 'gameplay';
  state.modal = { type: 'none' };
  state.modalDismissGraceRemaining = 0;
  state.blockedShopUntilExit = 'save';
  state.player.position = {
    x: savePad?.x ?? state.player.position.x,
    y: -PLAYER_HALF_HEIGHT - 0.02,
  };
  state.player.velocity = { x: 0, y: 0 };
  state.player.lastSurfaceZone = null;
}
