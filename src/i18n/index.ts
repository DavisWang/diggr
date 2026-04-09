import { BLOCK_DEFS, CONSUMABLE_DEFS, UPGRADE_TIER_DEFS } from '../config/content';
import type { BlockType, ConsumableType, EquipmentTier, I18nToast, ShopType, UpgradeType } from '../types';
import { loadLocalePreference, persistLocalePreference } from './storage';
import type { Locale } from './types';
import { UI_MESSAGES } from './ui-messages';
import { ZH_BLOCKS, ZH_CONSUMABLES, ZH_SURFACE_SHOP, ZH_TIER_WORD, ZH_UPGRADES } from './zh-game';

let currentLocale: Locale | null = null;

function resolvedLocale(): Locale {
  if (currentLocale === null) {
    currentLocale = loadLocalePreference();
  }
  return currentLocale;
}

export type { Locale } from './types';
export type { I18nToast } from '../types';

export function getLocale(): Locale {
  return resolvedLocale();
}

export function setLocale(locale: Locale): void {
  currentLocale = locale;
  persistLocalePreference(locale);
  applyDocumentLocale(locale);
}

export function applyDocumentLocale(locale?: Locale): void {
  if (typeof document === 'undefined') {
    return;
  }

  const active = locale ?? resolvedLocale();
  document.documentElement.lang = active === 'zh-CN' ? 'zh-CN' : 'en';
  document.documentElement.classList.toggle('locale-zh', active === 'zh-CN');
  document.title = t('doc.title');
}

/** Vitest: force English so string assertions stay stable. */
export function resetLocaleForTests(locale: Locale = 'en'): void {
  currentLocale = locale;
  applyDocumentLocale(locale);
}

export function t(key: string, vars?: Record<string, string | number>): string {
  const table = UI_MESSAGES[resolvedLocale()] ?? UI_MESSAGES.en;
  let template = table[key] ?? UI_MESSAGES.en[key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      const token = `{{${name}}}`;
      while (template.includes(token)) {
        template = template.replace(token, String(value));
      }
    }
  }
  return template;
}

export function toastRef(key: string, vars?: Record<string, string | number>): I18nToast {
  return vars ? { key, vars } : { key };
}

export function formatToast(toast: I18nToast | null | undefined): string | null {
  if (toast == null) {
    return null;
  }
  return t(toast.key, toast.vars);
}

/** Migrate saves that stored a plain string toast (dropped) or validate i18n payload. */
export function normalizeGameToast(raw: unknown): I18nToast | null {
  if (raw == null) {
    return null;
  }
  if (typeof raw === 'string') {
    return null;
  }
  if (typeof raw === 'object' && raw !== null && 'key' in raw) {
    const o = raw as Record<string, unknown>;
    if (typeof o.key !== 'string') {
      return null;
    }
    const vars = o.vars;
    if (vars != null && typeof vars === 'object' && !Array.isArray(vars)) {
      return { key: o.key, vars: vars as Record<string, string | number> };
    }
    return { key: o.key };
  }
  return null;
}

export function blockLabel(type: BlockType): string {
  if (resolvedLocale() === 'zh-CN') {
    return ZH_BLOCKS[type];
  }
  return BLOCK_DEFS[type].label;
}

export function consumableLabel(type: ConsumableType): string {
  if (resolvedLocale() === 'zh-CN') {
    return ZH_CONSUMABLES[type].label;
  }
  return CONSUMABLE_DEFS[type].label;
}

export function consumableDescription(type: ConsumableType): string {
  if (resolvedLocale() === 'zh-CN') {
    return ZH_CONSUMABLES[type].description;
  }
  return CONSUMABLE_DEFS[type].description;
}

export function upgradeLabel(category: UpgradeType, tier: EquipmentTier): string {
  if (resolvedLocale() === 'zh-CN') {
    return ZH_UPGRADES[category][tier].label;
  }
  return UPGRADE_TIER_DEFS[category][tier].label;
}

export function upgradeDescription(category: UpgradeType, tier: EquipmentTier): string {
  if (resolvedLocale() === 'zh-CN') {
    return ZH_UPGRADES[category][tier].description;
  }
  return UPGRADE_TIER_DEFS[category][tier].description;
}

export function tierPrettyName(tier: EquipmentTier): string {
  if (resolvedLocale() === 'zh-CN') {
    return ZH_TIER_WORD[tier];
  }
  return tier
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function upgradeCategoryLabel(type: UpgradeType): string {
  const key = `upgrade.category.${type}` as const;
  const localized = t(key);
  if (localized !== key) {
    return localized;
  }
  return type
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function surfaceShopLabel(shop: ShopType): string {
  if (resolvedLocale() === 'zh-CN') {
    return ZH_SURFACE_SHOP[shop];
  }
  switch (shop) {
    case 'upgrades':
      return 'Upgrades Shop';
    case 'consumables':
      return 'Consumables';
    case 'refinery':
      return 'Ore Refinery';
    case 'service':
      return 'Repair + Refuel';
    case 'save':
      return 'Save';
    default:
      return shop;
  }
}

export function getHowToFooterLines(): string[] {
  return [t('howto.footer.0'), t('howto.footer.1'), t('howto.footer.2'), t('howto.footer.3')];
}
