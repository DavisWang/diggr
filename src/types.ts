export type EquipmentTier =
  | 'bronzium'
  | 'silverium'
  | 'goldium'
  | 'mithrium'
  | 'adamantium'
  | 'runite';

export type UpgradeType =
  | 'drill'
  | 'hull'
  | 'cargo_hold'
  | 'thrusters'
  | 'fuel_tank'
  | 'radiator';

export type OreBlockType =
  | 'tinnite'
  | 'bronzium_ore'
  | 'silverium'
  | 'goldium_ore'
  | 'mithrium'
  | 'adamantium_ore'
  | 'runite_ore';

export type TreasureType = 'alien_skeleton' | 'alien_artifact';

export type BlockType =
  | 'air'
  | 'dirt'
  | 'rock'
  | 'lava'
  | 'hidden_lava'
  | OreBlockType
  | TreasureType;

export type SellableMaterial = OreBlockType | TreasureType;

export type ConsumableType =
  | 'repair_nanobot'
  | 'repair_microbot'
  | 'small_fuel_tank'
  | 'large_fuel_tank'
  | 'small_tnt'
  | 'large_tnt'
  | 'matter_transporter'
  | 'quantum_fissurizer';

export type ShopType = 'upgrades' | 'consumables' | 'refinery' | 'service' | 'save';

export type ScreenType = 'title' | 'gameplay';

export type ModalType =
  | 'none'
  | 'how_to'
  | 'inventory'
  | 'upgrades'
  | 'consumables'
  | 'refinery'
  | 'service'
  | 'save'
  | 'game_over';

export type Direction = 'left' | 'right' | 'down';

export interface Vector2 {
  x: number;
  y: number;
}

export interface BlockDef {
  type: BlockType;
  label: string;
  value: number;
  cargo: number;
  color: string;
  spriteFrame: number;
  spriteVariantFrames?: number[];
  hardness: 'empty' | 'soft' | 'ore' | 'rock' | 'lava';
  requiredDrill?: EquipmentTier;
  hazardDamage?: number;
  immediateCash?: boolean;
  disguisedAs?: BlockType;
}

export interface ConsumableDef {
  type: ConsumableType;
  label: string;
  description: string;
  price: number;
  hotkey: string;
}

export interface UpgradeTierDef {
  tier: EquipmentTier;
  label: string;
  price: number;
  description: string;
  statValue: number;
  digSpeed?: number;
  safeDepth?: number;
  lavaMitigation?: number;
}

export interface MaterialSellDef {
  type: SellableMaterial;
  label: string;
  value: number;
}

export interface BlockCell {
  type: BlockType;
  discovered: boolean;
}

export interface ActiveDrillState {
  x: number;
  row: number;
  direction: Direction;
  blockType: BlockType;
  fuelCost: number;
  remainingSeconds: number;
  totalSeconds: number;
}

export interface DrillRenderState {
  x: number;
  row: number;
  progress: number;
  direction: Direction;
  blockType: BlockType;
}

export interface ActiveConsumableEffectState {
  type: ConsumableType;
  remainingSeconds: number;
  totalSeconds: number;
}

export interface ActiveEarthquakeState {
  id: number;
  remainingSeconds: number;
  totalSeconds: number;
  regenerateFromRow: number;
}

export interface WorldChunk {
  index: number;
  seed: number;
  rows: Record<string, BlockCell[]>;
}

export interface WorldState {
  seed: number;
  layoutSeed: number;
  width: number;
  chunkSize: number;
  chunks: Record<string, WorldChunk>;
  destroyedCells: Record<string, true>;
  discoveredCells: Record<string, true>;
}

export type EquipmentLevels = Record<UpgradeType, EquipmentTier>;
export type InventoryState = Record<ConsumableType, number>;
export type CargoState = Partial<Record<SellableMaterial, number>>;

export interface PlayerState {
  position: Vector2;
  velocity: Vector2;
  health: number;
  maxHealth: number;
  fuel: number;
  maxFuel: number;
  cash: number;
  totalEarnings: number;
  cargoUsed: number;
  cargoCapacity: number;
  cargo: CargoState;
  inventory: InventoryState;
  equipment: EquipmentLevels;
  airborne: boolean;
  airbornePeakY: number;
  digCooldown: number;
  activeDrill: ActiveDrillState | null;
  lastSurfaceZone: ShopType | null;
}

export interface ModalState {
  type: ModalType;
  selectedCategory?: UpgradeType;
  selectedId?: string;
  message?: string;
}

export interface GameMeta {
  version: number;
  createdAt: string;
  updatedAt: string;
  hasVisitedUnderground: boolean;
  testingMode: boolean;
  shopCloseCount: number;
  earthquakeCount: number;
}

/** Resolved at render time via `t(key, vars)` so locale switches update HUD toasts. */
export interface I18nToast {
  key: string;
  vars?: Record<string, string | number>;
}

export interface GameState {
  status: 'active' | 'game_over';
  mode: 'gameplay' | 'modal';
  modal: ModalState;
  modalDismissGraceRemaining: number;
  activeConsumableEffect: ActiveConsumableEffectState | null;
  activeEarthquake: ActiveEarthquakeState | null;
  world: WorldState;
  player: PlayerState;
  meta: GameMeta;
  toast: I18nToast | null;
  blockedShopUntilExit: ShopType | null;
  blockSurfaceShopsUntilStop: boolean;
  viewportBottomRow: number;
}

export interface SaveData {
  version: number;
  savedAt: string;
  state: GameState;
}

export interface ControlState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  consume: ConsumableType[];
  toggleInventory?: boolean;
  viewportBottomRow?: number;
  triggerEarthquake?: boolean;
}

export interface TickResult {
  surfaceReturn: boolean;
  gameOver: boolean;
  openedShop: ShopType | null;
  toast?: I18nToast;
}

export interface DepthBandConfig {
  name: string;
  maxDepth: number;
  weights: Record<BlockType, number>;
  cavernChance: number;
}

export interface ShopPad {
  shop: ShopType;
  label: string;
  color: string;
  x: number;
  y: number;
  width: number;
  spriteFrame: number;
  spriteWidthTiles: number;
  spriteHeightTiles: number;
  spriteOffsetY: number;
  labelOffsetY: number;
}
