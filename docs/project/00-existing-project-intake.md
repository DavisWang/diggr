# Existing Project Intake

## Header

- Project: `Diggr`
- Owner: `Davis Wang`
- Date: `2026-03-31`
- Requested outcome: Add retro background music, gameplay sound FX, and an unobtrusive corner toggle for audio on/off, with a proposed cue list reviewed before implementation.
- Active platform profile: `browser-first`

## Current Playable State

`Diggr` is already a fully playable browser-first mining game with title flow, deterministic mine generation, digging/flying, surface shops, save/load, inventory, timed drilling, consumable effects, and earthquakes working locally. Baseline verification passed on `2026-03-31` with `npm test` (`91` tests passing) and `npm run build`. The current build has no audio runtime, no music or SFX assets, no persisted audio preference, and no mute/toggle control in either the title or gameplay surfaces.

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

- [main.ts](/Users/davis.wang/Documents/diggr/src/main.ts)
- [storage.ts](/Users/davis.wang/Documents/diggr/src/lib/storage.ts)
- [logic.ts](/Users/davis.wang/Documents/diggr/src/game/logic.ts)
- [content.ts](/Users/davis.wang/Documents/diggr/src/config/content.ts)
- [GameScene.ts](/Users/davis.wang/Documents/diggr/src/phaser/GameScene.ts)
- [TitleScene.ts](/Users/davis.wang/Documents/diggr/src/phaser/TitleScene.ts)
- [DiggrApp.ts](/Users/davis.wang/Documents/diggr/src/ui/DiggrApp.ts)
- [renderers.ts](/Users/davis.wang/Documents/diggr/src/ui/renderers.ts)
- [styles.css](/Users/davis.wang/Documents/diggr/src/styles.css)
- [types.ts](/Users/davis.wang/Documents/diggr/src/types.ts)
- [app.test.ts](/Users/davis.wang/Documents/diggr/tests/app.test.ts)
- [logic.test.ts](/Users/davis.wang/Documents/diggr/tests/logic.test.ts)
- [ui.test.ts](/Users/davis.wang/Documents/diggr/tests/ui.test.ts)

## Current Run And Test Commands

- install: `npm install`
- run: `npm run dev`
- build: `npm run build`
- preview: `npm run preview`
- test: `npm test`

## Known Bugs And Quality Gaps

- The shipped build is silent. There is no background music, no gameplay SFX, and no audio preference persistence.
- Browser autoplay/user-gesture unlock has not been handled anywhere in the app shell yet, so audio must be introduced in a way that respects browser-first delivery constraints.
- Gameplay does not currently expose a structured audio-event surface, so the safest implementation path is to hook audio to real state transitions rather than infer events from toast strings or DOM labels.

## Artifact Status

| Artifact | Status | Notes |
| --- | --- | --- |
| `docs/project/00-existing-project-intake.md` | `refresh_required` | The loop scope changed from title/how-to presentation polish to audio/music and toggle behavior. |
| `docs/project/01-work-order.md` | `refresh_required` | The work packet needs to match the audio loop and proposal checkpoint. |
| [README.md](/Users/davis.wang/Documents/diggr/README.md) | `refresh_required` | Feature overview and local behavior notes should mention shipped audio once the pass lands. |
| [architecture.md](/Users/davis.wang/Documents/diggr/docs/architecture.md) | `refresh_required` | Runtime boundaries should document the audio layer and where event hooks live once implemented. |
| `Audio runtime and preference persistence` | `missing` | There is no audio manager, unlock path, or saved audio setting today. |
| `Gameplay-to-audio event surface` | `missing` | Logic, app shell, and scenes do not currently publish explicit cue events. |
| `Corner audio toggle UI` | `missing` | No always-available title/gameplay control exists for muting audio. |
| `Audio-focused regression coverage` | `missing` | No tests cover toggle visibility, persistence, or audio event routing. |
| `Core gameplay behavior and visual presentation` | `reusable` | Mining, economy, title/how-to visuals, shops, earthquakes, save/load, and sprite language should remain intact. |
| `Deployment workflow` | `out_of_scope` | No release pipeline change required. |

## Recommended Loop Scope

- Refresh only the request-affected surfaces: app-shell audio ownership, preference storage, scene/audio hooks, a small overlay toggle, targeted tests, and minimal docs.
- Preserve current gameplay rules, controls, modal flow, shops, save/load behavior, and the already-approved sprite/title language; the new corner toggle should fit into the existing overlay shell instead of forcing a UI redesign.
- Use a proposal checkpoint before gameplay implementation to confirm the cue inventory and sonic direction, then run a targeted implementation loop on the approved set only.
