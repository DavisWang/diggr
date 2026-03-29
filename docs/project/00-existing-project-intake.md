# Existing Project Intake

## Header

- Project: `Diggr`
- Owner: `Davis Wang`
- Date: `2026-03-29`
- Requested outcome: Add visual use animations for consumable items without changing their current gameplay outcomes.
- Active platform profile: `browser-first`

## Current Playable State

`Diggr` is already a playable browser-first mining prototype. The title flow, deterministic mine generation, digging loop, gravity/fuel/damage systems, surface shops, save/load, and inventory all work locally. Timed drilling already has a dedicated erosion animation path. Consumables already work mechanically through hotkeys and inventory counts, but before this loop they resolved with toast text only and no dedicated in-world animation layer.

## Docs Reviewed

- [README.md](/Users/davis.wang/Documents/diggr/README.md)
- [architecture.md](/Users/davis.wang/Documents/diggr/docs/architecture.md)
- [deployment.md](/Users/davis.wang/Documents/diggr/docs/deployment.md)
- [index.md](/Users/davis.wang/Documents/pwner-studios-dev-team/docs/index.md)
- [game-lifecycle.md](/Users/davis.wang/Documents/pwner-studios-dev-team/docs/workflows/game-lifecycle.md)
- [browser-first.md](/Users/davis.wang/Documents/pwner-studios-dev-team/docs/contracts/platforms/browser-first.md)
- [producer.md](/Users/davis.wang/Documents/pwner-studios-dev-team/docs/contracts/roles/producer.md)
- [existing-project-intake.md](/Users/davis.wang/Documents/pwner-studios-dev-team/docs/templates/existing-project-intake.md)
- [work-order.md](/Users/davis.wang/Documents/pwner-studios-dev-team/docs/templates/work-order.md)

## Code Areas Reviewed

- [logic.ts](/Users/davis.wang/Documents/diggr/src/game/logic.ts)
- [GameScene.ts](/Users/davis.wang/Documents/diggr/src/phaser/GameScene.ts)
- [rendering.ts](/Users/davis.wang/Documents/diggr/src/phaser/rendering.ts)
- [types.ts](/Users/davis.wang/Documents/diggr/src/types.ts)
- [content.ts](/Users/davis.wang/Documents/diggr/src/config/content.ts)
- [logic.test.ts](/Users/davis.wang/Documents/diggr/tests/logic.test.ts)
- [rendering.test.ts](/Users/davis.wang/Documents/diggr/tests/rendering.test.ts)

## Current Run And Test Commands

- run: `npm run dev`
- build: `npm run build`
- preview: `npm run preview`
- test: `npm test`

## Known Bugs And Quality Gaps

- Prior to this loop, consumables had mechanical effects but no distinct visual-use feedback in the Phaser scene.
- The consumable feature surface is tightly coupled to hotkeys and inventory counts, so regressions would be easy if the visual layer bypassed gameplay state.

## Artifact Status

| Artifact | Status | Notes |
| --- | --- | --- |
| `docs/project/00-existing-project-intake.md` | `missing` | Required by the harness for existing-project mode. |
| `docs/project/01-work-order.md` | `missing` | Required to scope the targeted loop. |
| [README.md](/Users/davis.wang/Documents/diggr/README.md) | `refresh_required` | Feature summary should include consumable-use animation coverage once landed. |
| [architecture.md](/Users/davis.wang/Documents/diggr/docs/architecture.md) | `refresh_required` | Runtime contract should mention the consumable effect state and Phaser FX layer. |
| `Consumable gameplay logic` | `refresh_required` | Current behavior lacks visual effect state. |
| `Phaser scene rendering` | `refresh_required` | Needs a dedicated effect layer for consumable animations. |
| `UI modal/shop docs` | `reusable` | Request does not change inventory or consumable-shop interaction structure. |
| `Deployment workflow` | `out_of_scope` | No release pipeline change required. |

## Recommended Loop Scope

- Refresh only the request-affected surfaces: consumable state handling, Phaser effect rendering, targeted tests, and lightweight docs.
- Preserve current hotkeys, inventory counts, item outcomes, drill cancellation rules, teleport destinations, and shop behavior.
- Do not rework the broader artifact chain unless implementation exposes a deeper mismatch between the docs and the current build.
