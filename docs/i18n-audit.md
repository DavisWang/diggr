# Internationalization audit (EN / 简体中文)

This document summarizes where player-visible copy lives and how it follows the selected locale.

## Mechanisms

| Mechanism | Role |
| --- | --- |
| `src/i18n/ui-messages.ts` | `t()` strings for chrome, HUD, modals, how-to, errors, drill/mining toasts, consumable results. |
| `src/i18n/zh-game.ts` | Simplified Chinese for blocks, shops, consumables, upgrades, tier words. |
| `blockLabel`, `consumableLabel`, `upgradeLabel`, `upgradeDescription`, `surfaceShopLabel`, `upgradeCategoryLabel`, `tierPrettyName` | Locale-aware labels sourced from `content.ts` or zh tables. |
| `GameState.toast` as `I18nToast` | `{ key, vars? }` resolved at render via `formatToast()` so **HUD toasts update when the language toggles** without re-running gameplay ticks. |
| `applyDocumentLocale()` | Sets `html[lang]`, `locale-zh` class, and **`document.title`** from `t('doc.title')`. |
| `GameScene` shop labels | `surfaceShopLabel()`; text refreshed when locale changes (see `shopLabelsLocale`). |

## Covered surfaces

- Title, footer, how-to modal, and all shop modals (upgrades, consumables, refinery, service, save, inventory, game over).
- HUD: cash, mode, zone (including `surfaceShopLabel` for last shop), health, fuel, depth suffix, cargo.
- Gameplay toasts from `logic.ts` (drill, mine, surface, earthquake, buy/sell/service, consumables).
- Refinery rows use `blockLabel` via `getCargoEntries`.
- Phaser floating labels above surface pads use `surfaceShopLabel`.

## Intentionally not translated

- **Brand / logo**: `DIGGR` pixel title and `aria-label` stay the product name.
- **Hotkey letters** in how-to (Z, A, X, …): physical keys, not language-specific copy.
- **Shop sprites** (`surface-shops.png`): artwork may show English; only the overlay text is localized.
- **Save file internals**: keys and enums (`ShopType`, block ids) remain English; only displayed strings localize.

## English-only paths in code (display-safe)

- `surfaceShopLabel()` for locale `en` uses inline English strings (not `t()`). Chinese uses `ZH_SURFACE_SHOP`. To unify, those English strings could move into `ui-messages.ts` as `surface.shop.upgrades` etc.
- `upgradeCategoryLabel()` falls back to title-casing the category id if a key is missing (should not happen for known types).
- `tierPrettyName()` for English title-cases tier ids from data.

## Historical / cleanup notes

- `damagePlayer(..., message)` ignored the message parameter; call sites no longer pass English sentences.
- Older saves with `toast` stored as a **plain string** are normalized on load to `null` (ephemeral UI); new saves persist `{ key, vars? }` when present.

## Verification

- Run `npm test` (logic tests use `formatToast` / toast keys where needed).
- Manually: start gameplay, trigger a toast, toggle locale in the chrome bar — toast text and HUD should match the new language without a new tick.
