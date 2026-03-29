# Existing Project Intake

## Header

- Project: `Diggr`
- Owner: `Davis Wang`
- Date: `2026-03-29`
- Requested outcome: Add a testing-only manual earthquake hotkey, bring generated sprite sheets and favicon back in sync with the shipped game, and refresh the docs to describe Diggr as GA-ready rather than a prototype.
- Active platform profile: `browser-first`

## Current Playable State

`Diggr` is already a fully playable browser-first mining game with title flow, deterministic mine generation, digging/flying, surface shops, save/load, inventory, timed drilling, consumable effects, and earthquakes working locally. The current request is a targeted polish loop across testing-mode controls, generated art assets, favicon/browser shell metadata, and docs language rather than a core gameplay redesign.

## Docs Reviewed

- [README.md](/Users/davis.wang/Documents/diggr/README.md)
- [architecture.md](/Users/davis.wang/Documents/diggr/docs/architecture.md)
- [deployment.md](/Users/davis.wang/Documents/diggr/docs/deployment.md)
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
- [GameScene.ts](/Users/davis.wang/Documents/diggr/src/phaser/GameScene.ts)
- [DiggrApp.ts](/Users/davis.wang/Documents/diggr/src/ui/DiggrApp.ts)
- [types.ts](/Users/davis.wang/Documents/diggr/src/types.ts)
- [content.ts](/Users/davis.wang/Documents/diggr/src/config/content.ts)
- [keyboard.ts](/Users/davis.wang/Documents/diggr/src/phaser/keyboard.ts)
- [index.html](/Users/davis.wang/Documents/diggr/index.html)
- [generateSpriteSheets.mjs](/Users/davis.wang/Documents/diggr/scripts/generateSpriteSheets.mjs)
- [generate_upgrade_shop_icons.py](/Users/davis.wang/Documents/diggr/scripts/generate_upgrade_shop_icons.py)
- [generate_consumable_shop_icons.py](/Users/davis.wang/Documents/diggr/scripts/generate_consumable_shop_icons.py)
- [generate_refinery_shop_icons.py](/Users/davis.wang/Documents/diggr/scripts/generate_refinery_shop_icons.py)
- [logic.test.ts](/Users/davis.wang/Documents/diggr/tests/logic.test.ts)
- [app.test.ts](/Users/davis.wang/Documents/diggr/tests/app.test.ts)

## Current Run And Test Commands

- run: `npm run dev`
- build: `npm run build`
- preview: `npm run preview`
- test: `npm test`

## Known Bugs And Quality Gaps

- Testing-only controls must call the real gameplay path instead of a fake debug branch, or the validation hook quickly drifts from the shipped mechanic.
- Asset generators were partially stale relative to the current runtime, especially around the fifth surface sprite and browser-facing icon metadata.

## Artifact Status

| Artifact | Status | Notes |
| --- | --- | --- |
| `docs/project/00-existing-project-intake.md` | `refresh_required` | The current loop changes scope from earthquake implementation to testing/asset/doc polish. |
| `docs/project/01-work-order.md` | `refresh_required` | The work packet needs to match the new polish request. |
| [README.md](/Users/davis.wang/Documents/diggr/README.md) | `refresh_required` | Marketing/runtime description should now describe a GA-ready game rather than a prototype. |
| [architecture.md](/Users/davis.wang/Documents/diggr/docs/architecture.md) | `refresh_required` | Asset-pipeline and testing-hook coverage should be documented. |
| `Testing input path` | `refresh_required` | Needs a manual earthquake trigger limited to testing mode. |
| `Sprite/favicons generators` | `refresh_required` | Need to match the current five-pad surface layout and emit browser icon assets. |
| `Core gameplay behavior` | `reusable` | Earthquake simulation, mining, economy, and UI flows should stay intact. |
| `Deployment workflow` | `out_of_scope` | No release pipeline change required. |

## Recommended Loop Scope

- Refresh only the request-affected surfaces: testing input controls, asset generation scripts, favicon/browser shell metadata, targeted tests, and lightweight docs.
- Preserve current shop UI, earthquake behavior, mining/economy rules, and all existing art direction that was already approved.
- Do not rework the broader artifact chain unless implementation exposes a deeper mismatch between the docs and the current build.
