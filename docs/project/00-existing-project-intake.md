# Existing Project Intake

## Header

- Project: `Diggr`
- Owner: `Davis Wang`
- Date: `2026-04-01`
- Requested outcome: Keep project documentation aligned with the shipped browser shell (i18n, chrome controls) and maintain a clean GitHub `main`.
- Active platform profile: `browser-first`

## Current Playable State

`Diggr` is a fully playable browser-first mining game with title flow, deterministic mine generation, digging/flying, surface shops, save/load, inventory, timed drilling, consumable effects, procedural audio, and rare shop-close earthquakes that reroll the underground layout. The UI supports **English** and **Simplified Chinese** via `src/i18n/`, with a bottom-right **chrome bar** that combines a single locale toggle (globe + active language badge) and an **icon-only** audio mute. The upgrade shop still defaults to drills on open.

## Docs Reviewed

- [AGENTS.md](/Users/davis.wang/Documents/diggr/AGENTS.md)
- [README.md](/Users/davis.wang/Documents/diggr/README.md)
- [architecture.md](/Users/davis.wang/Documents/diggr/docs/architecture.md)
- [deployment.md](/Users/davis.wang/Documents/diggr/docs/deployment.md)
- [i18n-fictional-names.md](/Users/davis.wang/Documents/diggr/docs/i18n-fictional-names.md)
- [00-existing-project-intake.md](/Users/davis.wang/Documents/diggr/docs/project/00-existing-project-intake.md)
- [01-work-order.md](/Users/davis.wang/Documents/diggr/docs/project/01-work-order.md)

## Code Areas Reviewed

- [logic.ts](/Users/davis.wang/Documents/diggr/src/game/logic.ts)
- [world.ts](/Users/davis.wang/Documents/diggr/src/game/world.ts)
- [content.ts](/Users/davis.wang/Documents/diggr/src/config/content.ts)
- [GameScene.ts](/Users/davis.wang/Documents/diggr/src/phaser/GameScene.ts)
- [DiggrApp.ts](/Users/davis.wang/Documents/diggr/src/ui/DiggrApp.ts)
- [renderers.ts](/Users/davis.wang/Documents/diggr/src/ui/renderers.ts)
- [src/i18n/](/Users/davis.wang/Documents/diggr/src/i18n/)

## Current Run And Test Commands

- install: `npm install`
- run: `npm run dev` → [http://localhost:5173/](http://localhost:5173/)
- build: `npm run build`
- preview: `npm run preview`
- test: `npm test`

## Known Bugs And Quality Gaps

- No request-specific gaps for this documentation pass. Fall-damage vs. multi-surface descent behavior remains a known design edge case if future tuning targets “true vertical drop” accounting.

## Artifact Status

| Artifact | Status | Notes |
| --- | --- | --- |
| `docs/project/00-existing-project-intake.md` | `reusable` | Refreshed for i18n + chrome + doc sync. |
| `docs/project/01-work-order.md` | `reusable` | Scoped to doc/README/architecture alignment. |
| [README.md](/Users/davis.wang/Documents/diggr/README.md) | `reusable` | Describes i18n, chrome bar, and repo map. |
| [architecture.md](/Users/davis.wang/Documents/diggr/docs/architecture.md) | `reusable` | Includes i18n and chrome boundaries. |
| [i18n-fictional-names.md](/Users/davis.wang/Documents/diggr/docs/i18n-fictional-names.md) | `reusable` | Optional translator reference. |
| `Deployment workflow` | `out_of_scope` | Unchanged unless deploy contract changes. |

## Recommended Loop Scope

- Targeted refresh only when gameplay or shell behavior changes; keep intake and work order in sync with `main`.
- Preserve working browser-first behavior unless a work order explicitly changes it.
