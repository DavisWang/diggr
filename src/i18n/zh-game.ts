import type { BlockType, ConsumableType, EquipmentTier, ShopType, UpgradeType } from '../types';

/** Simplified Chinese for block HUD / drilling / cargo. See docs/i18n-fictional-names.md for naming rationale. */
export const ZH_BLOCKS: Record<BlockType, string> = {
  air: '空气',
  dirt: '泥土',
  rock: '岩石',
  lava: '熔岩',
  hidden_lava: '隐藏熔岩',
  tinnite: '锡铁石',
  bronzium_ore: '青铜矿石',
  silverium: '银辉矿',
  goldium_ore: '金耀矿',
  mithrium: '秘银矿',
  adamantium_ore: '精金矿',
  runite_ore: '符纹矿',
  alien_skeleton: '外星骸骨',
  alien_artifact: '外星遗物',
};

export const ZH_CONSUMABLES: Record<ConsumableType, { label: string; description: string }> = {
  repair_nanobot: { label: '维修纳米机', description: '恢复少量生命值。' },
  repair_microbot: { label: '维修微型机', description: '恢复大量生命值。' },
  small_fuel_tank: { label: '小型燃料罐', description: '立刻补充少量燃料。' },
  large_fuel_tank: { label: '大型燃料罐', description: '立刻补充大量燃料。' },
  small_tnt: { label: '小型炸药', description: '爆破钻机周围 3×3 区域。' },
  large_tnt: { label: '大型炸药', description: '爆破钻机周围 5×5 区域。' },
  matter_transporter: { label: '物质传送器', description: '传送到维修站旁。' },
  quantum_fissurizer: { label: '量子裂隙器', description: '将钻机抛到地面随机位置并赋予速度。' },
};

export const ZH_TIER_WORD: Record<EquipmentTier, string> = {
  bronzium: '青铜',
  silverium: '银辉',
  goldium: '金耀',
  mithrium: '秘银',
  adamantium: '精金',
  runite: '符纹',
};

export const ZH_SURFACE_SHOP: Record<ShopType, string> = {
  upgrades: '升级商店',
  consumables: '补给站',
  refinery: '矿石精炼厂',
  service: '维修加油',
  save: '存档',
};

type TierCopy = { label: string; description: string };

export const ZH_UPGRADES: Record<UpgradeType, Record<EquipmentTier, TierCopy>> = {
  drill: {
    bronzium: {
      label: '青铜钻头',
      description: '初始钻头。适合青铜级矿石，可勉强超速钻向银辉矿。',
    },
    silverium: {
      label: '银辉钻头',
      description: '可高效开采银辉矿，必要时超速钻向金耀矿（有惩罚）。',
    },
    goldium: {
      label: '金耀钻头',
      description: '可高效开采金耀矿，需要时可超速钻向秘银矿。',
    },
    mithrium: {
      label: '秘银钻头',
      description: '可高效开采秘银矿，深处可超速钻向精金矿。',
    },
    adamantium: {
      label: '精金钻头',
      description: '可高效开采精金矿，代价较高时可超速钻向符纹矿。',
    },
    runite: {
      label: '符纹钻头',
      description: '顶级钻头，适合最深矿脉，无需再依赖超速。',
    },
  },
  hull: {
    bronzium: { label: '青铜外壳', description: '基础框架与生命值。' },
    silverium: { label: '银辉外壳', description: '提高坠落与熔岩撞击的生存性。' },
    goldium: { label: '金耀外壳', description: '中期耐久提升。' },
    mithrium: { label: '秘银外壳', description: '让更长的深潜跑图更可行。' },
    adamantium: { label: '精金外壳', description: '高端抗冲击。' },
    runite: { label: '符纹外壳', description: '最大生命值，适合最深区域。' },
  },
  cargo_hold: {
    bronzium: { label: '青铜货舱', description: '基础载货量。' },
    silverium: { label: '银辉货舱', description: '浅层多跑一趟的空间。' },
    goldium: { label: '金耀货舱', description: '回地表精炼前可装更多。' },
    mithrium: { label: '秘银货舱', description: '显著减少往返次数。' },
    adamantium: { label: '精金货舱', description: '深层混合矿石与炸药/传送余量。' },
    runite: { label: '符纹货舱', description: '终局载货容量。' },
  },
  thrusters: {
    bronzium: { label: '青铜推进器', description: '初始升力与负重容忍。' },
    silverium: { label: '银辉推进器', description: '中等负重下更容易起飞。' },
    goldium: { label: '金耀推进器', description: '更强升力与横向响应。' },
    mithrium: { label: '秘银推进器', description: '支撑更重的深潜载荷。' },
    adamantium: { label: '精金推进器', description: '高负重下的升力升级。' },
    runite: { label: '符纹推进器', description: '最大升力与操控响应。' },
  },
  fuel_tank: {
    bronzium: { label: '青铜燃料箱', description: '基础燃料储备。' },
    silverium: { label: '银辉燃料箱', description: '小幅延长续航。' },
    goldium: { label: '金耀燃料箱', description: '支持更长循环再加油。' },
    mithrium: { label: '秘银燃料箱', description: '深潜燃料缓冲。' },
    adamantium: { label: '精金燃料箱', description: '大路线燃料储备。' },
    runite: { label: '符纹燃料箱', description: '游戏中最大燃料箱。' },
  },
  radiator: {
    bronzium: {
      label: '青铜散热器',
      description: '基础散热。仅在浅层安全。',
    },
    silverium: {
      label: '银辉散热器',
      description: '降低熔岩伤害并提高安全深度上限。',
    },
    goldium: {
      label: '金耀散热器',
      description: '让中层熔岩不那么致命。',
    },
    mithrium: {
      label: '秘银散热器',
      description: '适合长时间深潜。',
    },
    adamantium: {
      label: '精金散热器',
      description: '安全进入后期深度带。',
    },
    runite: {
      label: '符纹散热器',
      description: '最佳耐热与熔岩减伤。',
    },
  },
};
