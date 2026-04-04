# Fictional names (EN → 简体中文) — translation strategies

Diggr uses spoof tier names (bronzium, silverium, …) and fantasy ores. Options for Chinese localization:

## 1. **Semantic fantasy tiers** (recommended for readability)

Treat them as in-world material grades, not real chemistry:

| English   | Suggested zh (tier flavor) | Notes |
|-----------|----------------------------|--------|
| Bronzium  | 青铜晶 / 青铜级          | “Bronze + -ium” joke → 青铜 + 晶 |
| Silverium | 银辉 / 白银级            | Silver tone |
| Goldium   | 金耀 / 黄金级            | Gold tone |
| Mithrium  | 秘银                     | Standard RPG term for mithril family |
| Adamantium| 精金                     | Common for “adamantine” fantasy metal in games |
| Runite    | 符纹矿 / 符文矿          | Suggests rune + ore; keeps “gamey” feel |

**Pros:** Reads naturally in shops and HUD. **Cons:** Loses the English pun.

## 2. **Phonetic / transliteration**

e.g. 布朗兹姆、西尔维里姆、戈耳迪厄姆、秘斯里厄姆、亚德曼提姆、鲁奈特.

**Pros:** Preserves “alien material” vibe. **Cons:** Long, harder to scan in tight UI.

## 3. **Hybrid**

Short tier name in stats (青铜 / 秘银 / 精金) + keep full item name as “XX 钻头 / XX 货舱” with the same tier word.

## Ores and treasures

- **Tinnite** → 锡铁石 / 廷奈特矿 (semantic vs light phonetic).
- **Bronzium Ore** → 青铜矿石 (clear).
- **Alien Skeleton / Artifact** → 外星骸骨 / 外星遗物 (standard sci-fi).

## What we ship in code

The `zh-CN` strings use **strategy 1 (semantic fantasy)** for tiers in full upgrade names and shorter tier words in HUD where space matters, aligned with common Chinese game localization habits.

You can swap to phonetic keys later by editing `src/i18n/zh-content.ts` and `src/i18n/ui-zh.ts` only.
