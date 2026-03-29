import type {
  BlockDef,
  BlockType,
  ConsumableDef,
  ConsumableType,
  DepthBandConfig,
  EquipmentTier,
  MaterialSellDef,
  SellableMaterial,
  ShopPad,
  ShopType,
  UpgradeTierDef,
  UpgradeType,
} from '../types';

export const SAVE_VERSION = 1;
export const STORAGE_KEY = 'diggr-save-slot';
export const WORLD_WIDTH = 13;
export const WORLD_CHUNK_SIZE = 24;
export const TILE_SIZE = 48;
export const SURFACE_SKY_ROWS = 5;
export const PLAYER_HALF_WIDTH = 0.34;
export const PLAYER_HALF_HEIGHT = 0.42;
export const DRILL_COMPLETION_INSET = 0.02;
export const ENTRY_COLUMN = Math.floor(WORLD_WIDTH / 2);
export const ENTRY_SHAFT_DEPTH = 2;
export const TESTING_MAX_HEALTH = 10_000;
export const TESTING_MAX_FUEL = 10_000;
export const TESTING_START_CASH = 999_999;

export const EQUIPMENT_TIERS: EquipmentTier[] = [
  'bronzium',
  'silverium',
  'goldium',
  'mithrium',
  'adamantium',
  'runite',
];

export const UPGRADE_TYPES: UpgradeType[] = [
  'drill',
  'hull',
  'cargo_hold',
  'thrusters',
  'fuel_tank',
  'radiator',
];

export const UPGRADE_ICON_FRAME_SIZE = 16;
export const UPGRADE_ICON_SHEET_COLUMNS = EQUIPMENT_TIERS.length;
export const UPGRADE_ICON_SHEET_ROWS = UPGRADE_TYPES.length;

export const SHOP_TYPES: ShopType[] = [
  'upgrades',
  'consumables',
  'refinery',
  'service',
  'save',
];

export const CONSUMABLE_TYPES: ConsumableType[] = [
  'repair_nanobot',
  'repair_microbot',
  'small_fuel_tank',
  'large_fuel_tank',
  'small_tnt',
  'large_tnt',
  'matter_transporter',
  'quantum_fissurizer',
];

export const CONSUMABLE_ICON_FRAME_SIZE = 16;
export const CONSUMABLE_ICON_SHEET_COLUMNS = 4;
export const CONSUMABLE_ICON_SHEET_ROWS = Math.ceil(CONSUMABLE_TYPES.length / CONSUMABLE_ICON_SHEET_COLUMNS);

export const BLOCK_DEFS: Record<BlockType, BlockDef> = {
  air: {
    type: 'air',
    label: 'Air',
    value: 0,
    cargo: 0,
    color: '#00000000',
    spriteFrame: 0,
    hardness: 'empty',
  },
  dirt: {
    type: 'dirt',
    label: 'Dirt',
    value: 0,
    cargo: 0,
    color: '#7d4e25',
    spriteFrame: 0,
    hardness: 'soft',
  },
  rock: {
    type: 'rock',
    label: 'Rock',
    value: 0,
    cargo: 0,
    color: '#6a7185',
    spriteFrame: 1,
    hardness: 'rock',
  },
  lava: {
    type: 'lava',
    label: 'Molten Lava',
    value: 0,
    cargo: 0,
    color: '#ff6f2d',
    spriteFrame: 2,
    hardness: 'lava',
    hazardDamage: 38,
  },
  hidden_lava: {
    type: 'hidden_lava',
    label: 'Hidden Lava',
    value: 0,
    cargo: 0,
    color: '#7d4e25',
    spriteFrame: 2,
    hardness: 'lava',
    hazardDamage: 42,
    disguisedAs: 'dirt',
  },
  tinnite: {
    type: 'tinnite',
    label: 'Tinnite',
    value: 18,
    cargo: 1,
    color: '#6f7785',
    spriteFrame: 3,
    hardness: 'ore',
    requiredDrill: 'bronzium',
  },
  bronzium_ore: {
    type: 'bronzium_ore',
    label: 'Bronzium Ore',
    value: 28,
    cargo: 1,
    color: '#b66c3d',
    spriteFrame: 4,
    hardness: 'ore',
    requiredDrill: 'bronzium',
  },
  silverium: {
    type: 'silverium',
    label: 'Silverium',
    value: 52,
    cargo: 1,
    color: '#cfd6de',
    spriteFrame: 5,
    hardness: 'ore',
    requiredDrill: 'silverium',
  },
  goldium_ore: {
    type: 'goldium_ore',
    label: 'Goldium',
    value: 86,
    cargo: 1,
    color: '#ffd84d',
    spriteFrame: 6,
    hardness: 'ore',
    requiredDrill: 'goldium',
  },
  mithrium: {
    type: 'mithrium',
    label: 'Mithrium',
    value: 128,
    cargo: 1,
    color: '#4c478d',
    spriteFrame: 7,
    hardness: 'ore',
    requiredDrill: 'mithrium',
  },
  adamantium_ore: {
    type: 'adamantium_ore',
    label: 'Adamantium',
    value: 188,
    cargo: 1,
    color: '#3d6e45',
    spriteFrame: 8,
    hardness: 'ore',
    requiredDrill: 'adamantium',
  },
  runite_ore: {
    type: 'runite_ore',
    label: 'Runite',
    value: 320,
    cargo: 1,
    color: '#8edcff',
    spriteFrame: 9,
    hardness: 'ore',
    requiredDrill: 'runite',
  },
  alien_skeleton: {
    type: 'alien_skeleton',
    label: 'Alien Skeleton',
    value: 160,
    cargo: 0,
    color: '#b7d0b3',
    spriteFrame: 10,
    hardness: 'ore',
    requiredDrill: 'mithrium',
    immediateCash: true,
  },
  alien_artifact: {
    type: 'alien_artifact',
    label: 'Alien Artifact',
    value: 250,
    cargo: 0,
    color: '#f677ff',
    spriteFrame: 11,
    spriteVariantFrames: [11, 12, 13],
    hardness: 'ore',
    requiredDrill: 'adamantium',
    immediateCash: true,
  },
};

const SELLABLE_MATERIALS: SellableMaterial[] = [
  'tinnite',
  'bronzium_ore',
  'silverium',
  'goldium_ore',
  'mithrium',
  'adamantium_ore',
  'runite_ore',
  'alien_skeleton',
  'alien_artifact',
];

export const REFINERY_TYPES: SellableMaterial[] = SELLABLE_MATERIALS;
export const REFINERY_ICON_FRAME_SIZE = 16;
export const REFINERY_ICON_SHEET_COLUMNS = 3;
export const REFINERY_ICON_SHEET_ROWS = Math.ceil(REFINERY_TYPES.length / REFINERY_ICON_SHEET_COLUMNS);

export const MATERIAL_DEFS: MaterialSellDef[] = SELLABLE_MATERIALS.map((type) => ({
  type,
  label: BLOCK_DEFS[type].label,
  value: BLOCK_DEFS[type].value,
}));

export const UPGRADE_TIER_DEFS: Record<UpgradeType, Record<EquipmentTier, UpgradeTierDef>> = {
  drill: {
    bronzium: {
      tier: 'bronzium',
      label: 'Bronzium Drill',
      price: 0,
      description: 'Starter drill. Efficient on bronzium-tier ore and can overclock into silverium slowly.',
      statValue: 1,
      digSpeed: 1,
    },
    silverium: {
      tier: 'silverium',
      label: 'Silverium Drill',
      price: 220,
      description: 'Efficient on silverium-tier ore and can overclock into goldium with a penalty.',
      statValue: 2,
      digSpeed: 1.18,
    },
    goldium: {
      tier: 'goldium',
      label: 'Goldium Drill',
      price: 450,
      description: 'Efficient on goldium-tier ore and can overclock into mithrium when needed.',
      statValue: 3,
      digSpeed: 1.38,
    },
    mithrium: {
      tier: 'mithrium',
      label: 'Mithrium Drill',
      price: 760,
      description: 'Efficient on mithrium-tier ore and can overclock into adamantium deeper down.',
      statValue: 4,
      digSpeed: 1.62,
    },
    adamantium: {
      tier: 'adamantium',
      label: 'Adamantium Drill',
      price: 1350,
      description: 'Efficient on adamantium-tier ore and can overclock into runite at a steep cost.',
      statValue: 5,
      digSpeed: 1.94,
    },
    runite: {
      tier: 'runite',
      label: 'Runite Drill',
      price: 2000,
      description: 'Top-tier drill for the deepest veins with no overclock penalty needed.',
      statValue: 6,
      digSpeed: 2.3,
    },
  },
  hull: {
    bronzium: {
      tier: 'bronzium',
      label: 'Bronzium Hull',
      price: 0,
      description: 'Baseline frame and health pool.',
      statValue: 100,
    },
    silverium: {
      tier: 'silverium',
      label: 'Silverium Hull',
      price: 180,
      description: 'Adds survivability against falls and lava hits.',
      statValue: 125,
    },
    goldium: {
      tier: 'goldium',
      label: 'Goldium Hull',
      price: 360,
      description: 'Mid-game durability bump.',
      statValue: 155,
    },
    mithrium: {
      tier: 'mithrium',
      label: 'Mithrium Hull',
      price: 620,
      description: 'Keeps longer deep runs viable.',
      statValue: 190,
    },
    adamantium: {
      tier: 'adamantium',
      label: 'Adamantium Hull',
      price: 1100,
      description: 'High-end impact resistance.',
      statValue: 230,
    },
    runite: {
      tier: 'runite',
      label: 'Runite Hull',
      price: 1600,
      description: 'Maximum health pool for late depth bands.',
      statValue: 275,
    },
  },
  cargo_hold: {
    bronzium: {
      tier: 'bronzium',
      label: 'Bronzium Cargo Hold',
      price: 0,
      description: 'Baseline cargo capacity.',
      statValue: 16,
    },
    silverium: {
      tier: 'silverium',
      label: 'Silverium Cargo Hold',
      price: 140,
      description: 'Adds room for one more shallow run.',
      statValue: 22,
    },
    goldium: {
      tier: 'goldium',
      label: 'Goldium Cargo Hold',
      price: 290,
      description: 'Allows better refinery runs before surfacing.',
      statValue: 30,
    },
    mithrium: {
      tier: 'mithrium',
      label: 'Mithrium Cargo Hold',
      price: 510,
      description: 'Cuts down return trips materially.',
      statValue: 40,
    },
    adamantium: {
      tier: 'adamantium',
      label: 'Adamantium Cargo Hold',
      price: 920,
      description: 'Supports deeper ore mix and more TNT/teleport margin.',
      statValue: 52,
    },
    runite: {
      tier: 'runite',
      label: 'Runite Cargo Hold',
      price: 1350,
      description: 'End-game cargo capacity.',
      statValue: 66,
    },
  },
  thrusters: {
    bronzium: {
      tier: 'bronzium',
      label: 'Bronzium Thrusters',
      price: 0,
      description: 'Starter lift and carry tolerance.',
      statValue: 1,
    },
    silverium: {
      tier: 'silverium',
      label: 'Silverium Thrusters',
      price: 180,
      description: 'Easier liftoff under moderate cargo.',
      statValue: 1.2,
    },
    goldium: {
      tier: 'goldium',
      label: 'Goldium Thrusters',
      price: 360,
      description: 'Stronger lift and better lateral response.',
      statValue: 1.4,
    },
    mithrium: {
      tier: 'mithrium',
      label: 'Mithrium Thrusters',
      price: 620,
      description: 'Sustains heavier deep-run payloads.',
      statValue: 1.65,
    },
    adamantium: {
      tier: 'adamantium',
      label: 'Adamantium Thrusters',
      price: 1100,
      description: 'High-lift upgrade for serious cargo.',
      statValue: 1.95,
    },
    runite: {
      tier: 'runite',
      label: 'Runite Thrusters',
      price: 1600,
      description: 'Maximum lift and responsiveness.',
      statValue: 2.3,
    },
  },
  fuel_tank: {
    bronzium: {
      tier: 'bronzium',
      label: 'Bronzium Fuel Tank',
      price: 0,
      description: 'Baseline fuel reserves.',
      statValue: 100,
    },
    silverium: {
      tier: 'silverium',
      label: 'Silverium Fuel Tank',
      price: 150,
      description: 'Small endurance increase.',
      statValue: 130,
    },
    goldium: {
      tier: 'goldium',
      label: 'Goldium Fuel Tank',
      price: 300,
      description: 'Supports longer loops before refuel.',
      statValue: 165,
    },
    mithrium: {
      tier: 'mithrium',
      label: 'Mithrium Fuel Tank',
      price: 520,
      description: 'Deep-run fuel buffer.',
      statValue: 205,
    },
    adamantium: {
      tier: 'adamantium',
      label: 'Adamantium Fuel Tank',
      price: 930,
      description: 'Strong reserve for bigger routes.',
      statValue: 250,
    },
    runite: {
      tier: 'runite',
      label: 'Runite Fuel Tank',
      price: 1380,
      description: 'Largest fuel reserve in the game.',
      statValue: 300,
    },
  },
  radiator: {
    bronzium: {
      tier: 'bronzium',
      label: 'Bronzium Radiator',
      price: 0,
      description: 'Basic heat handling. Safe only at shallow depth.',
      statValue: 1,
      safeDepth: 22,
      lavaMitigation: 0.08,
    },
    silverium: {
      tier: 'silverium',
      label: 'Silverium Radiator',
      price: 180,
      description: 'Reduces lava damage and lifts the safe-depth ceiling.',
      statValue: 2,
      safeDepth: 45,
      lavaMitigation: 0.18,
    },
    goldium: {
      tier: 'goldium',
      label: 'Goldium Radiator',
      price: 360,
      description: 'Makes mid-depth lava much less punishing.',
      statValue: 3,
      safeDepth: 75,
      lavaMitigation: 0.28,
    },
    mithrium: {
      tier: 'mithrium',
      label: 'Mithrium Radiator',
      price: 620,
      description: 'Practical for sustained deep runs.',
      statValue: 4,
      safeDepth: 115,
      lavaMitigation: 0.38,
    },
    adamantium: {
      tier: 'adamantium',
      label: 'Adamantium Radiator',
      price: 1100,
      description: 'Carries the digger safely into late-depth bands.',
      statValue: 5,
      safeDepth: 170,
      lavaMitigation: 0.5,
    },
    runite: {
      tier: 'runite',
      label: 'Runite Radiator',
      price: 1600,
      description: 'Best heat tolerance and lava mitigation.',
      statValue: 6,
      safeDepth: 240,
      lavaMitigation: 0.62,
    },
  },
};

export const CONSUMABLE_DEFS: Record<ConsumableType, ConsumableDef> = {
  repair_nanobot: {
    type: 'repair_nanobot',
    label: 'Repair Nanobot',
    description: 'Restore a small amount of health.',
    price: 40,
    hotkey: 'Z',
  },
  repair_microbot: {
    type: 'repair_microbot',
    label: 'Repair Microbot',
    description: 'Restore a larger amount of health.',
    price: 75,
    hotkey: 'A',
  },
  small_fuel_tank: {
    type: 'small_fuel_tank',
    label: 'Small Fuel Tank',
    description: 'Refuel a modest amount instantly.',
    price: 38,
    hotkey: 'X',
  },
  large_fuel_tank: {
    type: 'large_fuel_tank',
    label: 'Large Fuel Tank',
    description: 'Refuel a large amount instantly.',
    price: 70,
    hotkey: 'S',
  },
  small_tnt: {
    type: 'small_tnt',
    label: 'Small TNT',
    description: 'Blast a 3x3 area around the digger.',
    price: 65,
    hotkey: 'C',
  },
  large_tnt: {
    type: 'large_tnt',
    label: 'Large TNT',
    description: 'Blast a 5x5 area around the digger.',
    price: 125,
    hotkey: 'D',
  },
  matter_transporter: {
    type: 'matter_transporter',
    label: 'Matter Transporter',
    description: 'Teleport beside the service station.',
    price: 120,
    hotkey: 'F',
  },
  quantum_fissurizer: {
    type: 'quantum_fissurizer',
    label: 'Quantum Fissurizer',
    description: 'Throw the digger to a random above-ground position with velocity.',
    price: 170,
    hotkey: 'V',
  },
};

export const DEPTH_BANDS: DepthBandConfig[] = [
  {
    name: 'shallow',
    maxDepth: 30,
    cavernChance: 0.08,
    weights: {
      air: 0,
      dirt: 68,
      rock: 2,
      lava: 1,
      hidden_lava: 0,
      tinnite: 16,
      bronzium_ore: 9,
      silverium: 3,
      goldium_ore: 1,
      mithrium: 0,
      adamantium_ore: 0,
      runite_ore: 0,
      alien_skeleton: 0,
      alien_artifact: 0,
    },
  },
  {
    name: 'mid',
    maxDepth: 70,
    cavernChance: 0.11,
    weights: {
      air: 0,
      dirt: 53,
      rock: 7,
      lava: 3,
      hidden_lava: 0,
      tinnite: 9,
      bronzium_ore: 12,
      silverium: 9,
      goldium_ore: 5,
      mithrium: 2,
      adamantium_ore: 0,
      runite_ore: 0,
      alien_skeleton: 0,
      alien_artifact: 0,
    },
  },
  {
    name: 'deep',
    maxDepth: 130,
    cavernChance: 0.13,
    weights: {
      air: 0,
      dirt: 42,
      rock: 12,
      lava: 5,
      hidden_lava: 3,
      tinnite: 3,
      bronzium_ore: 8,
      silverium: 10,
      goldium_ore: 8,
      mithrium: 6,
      adamantium_ore: 2,
      runite_ore: 0,
      alien_skeleton: 1,
      alien_artifact: 0,
    },
  },
  {
    name: 'deepest',
    maxDepth: Number.POSITIVE_INFINITY,
    cavernChance: 0.15,
    weights: {
      air: 0,
      dirt: 34,
      rock: 16,
      lava: 7,
      hidden_lava: 5,
      tinnite: 0,
      bronzium_ore: 3,
      silverium: 8,
      goldium_ore: 9,
      mithrium: 8,
      adamantium_ore: 6,
      runite_ore: 3,
      alien_skeleton: 1,
      alien_artifact: 1,
    },
  },
];

export const PHYSICS = {
  horizontalThrust: 18,
  verticalThrust: 28,
  minimumTakeoffRatio: 0.8,
  gravity: 20,
  dragGround: 8,
  dragAir: 1.8,
  maxHorizontalSpeed: 7.4,
  maxVerticalSpeed: 10.5,
  cargoWeightPenalty: 1.6,
  movementFuelPerSecond: 0.55,
  flightFuelPerSecond: 2.7,
  digFuelBase: 3.2,
  digTimeBaseSeconds: 0.36,
  digTimeValueFactorSeconds: 0.0043,
  overtierDrillFuelMultiplier: 1.85,
  overtierDrillTimeMultiplier: 1.7,
  ambientHeatPerSecond: 2.8,
  fallDamageStartDistance: 10,
  fallDamageMaxDistance: 30,
  fallDamageSafeImpactSpeed: 3.2,
  fallDamageFullImpactSpeed: 9.5,
  fallDamageMaxHealthFraction: 0.8,
};

export const SURFACE_RENDER_OFFSET = 0.02;
export const SHOP_MOVEMENT_DISMISS_GRACE_SECONDS = 1.5;

export const PLAYER_START_CASH = 180;

export const SURFACE_PADS: ShopPad[] = [
  {
    shop: 'upgrades',
    label: 'Upgrades Shop',
    color: '#cb8754',
    x: 1.4,
    y: -1.35,
    width: 2.3,
    spriteFrame: 0,
    spriteWidthTiles: 1.18,
    spriteHeightTiles: 1.18,
    spriteOffsetY: 0.92,
    labelOffsetY: -0.78,
  },
  {
    shop: 'consumables',
    label: 'Consumables',
    color: '#59b4d2',
    x: 4.15,
    y: -1.35,
    width: 2.3,
    spriteFrame: 1,
    spriteWidthTiles: 1.18,
    spriteHeightTiles: 1.18,
    spriteOffsetY: 0.92,
    labelOffsetY: -0.78,
  },
  {
    shop: 'refinery',
    label: 'Ore Refinery',
    color: '#bc7aff',
    x: 8.3,
    y: -1.35,
    width: 2.3,
    spriteFrame: 2,
    spriteWidthTiles: 1.18,
    spriteHeightTiles: 1.18,
    spriteOffsetY: 0.92,
    labelOffsetY: -0.78,
  },
  {
    shop: 'service',
    label: 'Repair + Refuel',
    color: '#77d15e',
    x: 10.85,
    y: -1.35,
    width: 2.1,
    spriteFrame: 3,
    spriteWidthTiles: 1.18,
    spriteHeightTiles: 1.18,
    spriteOffsetY: 0.92,
    labelOffsetY: -0.78,
  },
  {
    shop: 'save',
    label: 'Save',
    color: '#ffd56b',
    x: 6.35,
    y: -3.05,
    width: 1.9,
    spriteFrame: 4,
    spriteWidthTiles: 1.08,
    spriteHeightTiles: 1.42,
    spriteOffsetY: 1.05,
    labelOffsetY: -1.02,
  },
];

export const TELEPORT_SERVICE_TARGET = { x: 10.85, y: -1.45 };

export const HOW_TO_COPY = [
  'Arrow keys move the digger. Fly with Up and dig left/right/down by pushing into blocks.',
  'Mine ore, surface, refine cargo, and buy better parts to reach deeper layers safely.',
  'Z/A repair. X/S refuel. C/D TNT. F matter transporter. V quantum fissurizer.',
  'Rock requires TNT. Lava hurts on contact. Hidden lava looks like dirt until you mine it.',
];

export function getTierIndex(tier: EquipmentTier): number {
  return EQUIPMENT_TIERS.indexOf(tier);
}

export function getUpgradeSpriteFrame(category: UpgradeType, tier: EquipmentTier): number {
  return UPGRADE_TYPES.indexOf(category) * UPGRADE_ICON_SHEET_COLUMNS + getTierIndex(tier);
}

export function getConsumableSpriteFrame(type: ConsumableType): number {
  return CONSUMABLE_TYPES.indexOf(type);
}

export function getRefinerySpriteFrame(type: SellableMaterial): number {
  return REFINERY_TYPES.indexOf(type);
}
