# Existing Project Intake

## Header

- Project: `Diggr`
- Owner: `Davis Wang`
- Date: `2026-03-29`
- Requested outcome: Refresh the title screen and How To Play screen so they use the actual generated game sprites and a stronger sprite-led art direction.
- Active platform profile: `browser-first`

## Current Playable State

`Diggr` is already a fully playable browser-first mining game with title flow, deterministic mine generation, digging/flying, surface shops, save/load, inventory, timed drilling, consumable effects, and earthquakes working locally. The current request is a targeted presentation loop focused on the title and How To Play surfaces, using the existing sprite language rather than changing core systems.

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
- [renderers.ts](/Users/davis.wang/Documents/diggr/src/ui/renderers.ts)
- [styles.css](/Users/davis.wang/Documents/diggr/src/styles.css)
- [TitleScene.ts](/Users/davis.wang/Documents/diggr/src/phaser/TitleScene.ts)
- [ui.test.ts](/Users/davis.wang/Documents/diggr/tests/ui.test.ts)

## Current Run And Test Commands

- run: `npm run dev`
- build: `npm run build`
- preview: `npm run preview`
- test: `npm test`

## Known Bugs And Quality Gaps

- The title and how-to screens currently underuse the approved sprite language, so they do not sell the current art direction or gameplay loop as clearly as the rest of the game.
- This request touches presentation only, so preserving existing handlers and modal flow matters more than introducing a second UI system.

## Artifact Status

| Artifact | Status | Notes |
| --- | --- | --- |
| `docs/project/00-existing-project-intake.md` | `refresh_required` | The loop scope changed from GA-polish controls/assets to title/how-to presentation polish. |
| `docs/project/01-work-order.md` | `refresh_required` | The work packet needs to match the UI/art request. |
| [README.md](/Users/davis.wang/Documents/diggr/README.md) | `refresh_required` | Feature overview should mention the sprite-backed title/how-to presentation. |
| [architecture.md](/Users/davis.wang/Documents/diggr/docs/architecture.md) | `refresh_required` | UI architecture should mention that title/how-to are sprite-backed DOM surfaces. |
| `Title and how-to renderer/styles` | `refresh_required` | This is the implementation target. |
| `Core gameplay behavior` | `reusable` | Mining, economy, earthquakes, save/load, and runtime art assets should stay intact. |
| `Deployment workflow` | `out_of_scope` | No release pipeline change required. |

## Recommended Loop Scope

- Refresh only the request-affected surfaces: title/how-to renderer markup, CSS, targeted UI tests, and lightweight docs.
- Preserve current handlers, modal flow, gameplay state transitions, and the already-approved sprite language.
- Do not rework the broader artifact chain unless implementation exposes a deeper mismatch between the docs and the current build.
