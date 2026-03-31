# Existing Project Intake

## Header

- Project: `Diggr`
- Owner: `Davis Wang`
- Date: `2026-03-31`
- Requested outcome: Retune earthquakes so shop-close triggers are `1%` and each quake fully regenerates the underground with a genuinely new layout.
- Active platform profile: `browser-first`

## Current Playable State

`Diggr` is already a fully playable browser-first mining game with title flow, deterministic mine generation, digging/flying, surface shops, save/load, inventory, timed drilling, consumable effects, procedural audio, and earthquakes working locally. The current build now uses a `1%` shop-close earthquake chance, rerolls the underground layout seed on quake so the mine regenerates as a genuinely new layout, and defaults the upgrade shop to drills on open.

## Docs Reviewed

- [AGENTS.md](/Users/davis.wang/Documents/diggr/AGENTS.md)
- [README.md](/Users/davis.wang/Documents/diggr/README.md)
- [architecture.md](/Users/davis.wang/Documents/diggr/docs/architecture.md)
- [deployment.md](/Users/davis.wang/Documents/diggr/docs/deployment.md)
- [00-existing-project-intake.md](/Users/davis.wang/Documents/diggr/docs/project/00-existing-project-intake.md)
- [01-work-order.md](/Users/davis.wang/Documents/diggr/docs/project/01-work-order.md)
- [tasks/todo.md](/Users/davis.wang/Documents/diggr/tasks/todo.md)
- [index.md](/Users/davis.wang/Documents/pwner-studios-dev-team/docs/index.md)
- [game-lifecycle.md](/Users/davis.wang/Documents/pwner-studios-dev-team/docs/workflows/game-lifecycle.md)
- [browser-first.md](/Users/davis.wang/Documents/pwner-studios-dev-team/docs/contracts/platforms/browser-first.md)
- [producer.md](/Users/davis.wang/Documents/pwner-studios-dev-team/docs/contracts/roles/producer.md)
- [existing-project-intake.md](/Users/davis.wang/Documents/pwner-studios-dev-team/docs/templates/existing-project-intake.md)
- [work-order.md](/Users/davis.wang/Documents/pwner-studios-dev-team/docs/templates/work-order.md)

## Code Areas Reviewed

- [logic.ts](/Users/davis.wang/Documents/diggr/src/game/logic.ts)
- [world.ts](/Users/davis.wang/Documents/diggr/src/game/world.ts)
- [content.ts](/Users/davis.wang/Documents/diggr/src/config/content.ts)
- [GameScene.ts](/Users/davis.wang/Documents/diggr/src/phaser/GameScene.ts)
- [renderers.ts](/Users/davis.wang/Documents/diggr/src/ui/renderers.ts)
- [types.ts](/Users/davis.wang/Documents/diggr/src/types.ts)
- [logic.test.ts](/Users/davis.wang/Documents/diggr/tests/logic.test.ts)

## Current Run And Test Commands

- install: `npm install`
- run: `npm run dev`
- build: `npm run build`
- preview: `npm run preview`
- test: `npm test`

## Known Bugs And Quality Gaps

- No new request-specific gameplay gaps were found after landing the earthquake retune and drill-first upgrade shop default.
- Remaining verification risk is feel-based only: quake rarity and shop-default usability are best confirmed in live play.

## Artifact Status

| Artifact | Status | Notes |
| --- | --- | --- |
| `docs/project/00-existing-project-intake.md` | `refresh_required` | The loop scope changed from audio delivery to earthquake tuning. |
| `docs/project/01-work-order.md` | `refresh_required` | The work packet needs to match the earthquake tuning request. |
| [README.md](/Users/davis.wang/Documents/diggr/README.md) | `refresh_required` | Earthquake description should match the new whole-underground regeneration behavior. |
| [architecture.md](/Users/davis.wang/Documents/diggr/docs/architecture.md) | `refresh_required` | Earthquake model details are stale and need the new chance/regeneration contract. |
| `Earthquake chance tuning` | `refresh_required` | `EARTHQUAKE_SHOP_CLOSE_CHANCE` needs to drop to `1%`. |
| `World regeneration model` | `refresh_required` | Earthquakes need a new layout seed rather than a rebuild from the same deterministic seed. |
| `Earthquake regression coverage` | `refresh_required` | Tests currently pin the old “below viewport only / same block type” behavior. |
| `Audio, UI, and unrelated gameplay systems` | `reusable` | Preserve current audio, movement, economy, shops, save/load, and presentation behavior. |
| `Deployment workflow` | `out_of_scope` | No release pipeline change required. |

## Recommended Loop Scope

- Refresh only the request-affected surfaces: earthquake probability, world-regeneration seeding, targeted logic tests, and the stale docs/copy that describe the old behavior.
- Preserve current gameplay rules outside the quake path, including audio, controls, shops, save/load, and the current browser-first shell.
- Keep the change narrow: no broader rebalance, no new event types, and no rewrite of unrelated artifact chains.
