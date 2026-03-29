# Work Order

## Header

- Project: `Diggr`
- Work order ID: `WO-2026-03-29-title-howto-art`
- Requester: `Davis Wang`
- Owner: `Producer`
- Project mode: `existing_project`
- Phase: `brownfield work order`
- Active platform profile: `browser-first`

## Objective

Add a targeted presentation pass that upgrades the title screen and How To Play screen to use the shipped sprite language and a stronger visual art direction. The implementation should preserve current handlers and gameplay behavior, and stay within a targeted refresh limited to the request-affected UI code, CSS, tests, and docs.

## Requested Change

Update the How To Play screen with actual game sprites and refresh the title screen to incorporate the current art direction and generated sprites, using creative liberty.

## Existing Behavior To Preserve

- Existing title handlers and modal behavior remain intact.
- Current gameplay state, save/load, shops, and HUD behavior remain intact.
- The already-approved sprite language should be reused rather than replaced with a new art system.
- TitleScene can remain a background layer, but the request should not force a new runtime UI architecture.

## In Scope

- Refresh the title-screen DOM markup to use sprite-backed hero art.
- Refresh the How To Play body to use sprite-backed instructional cards.
- Add targeted UI regressions for the new presentation structure.
- Refresh the minimal docs required for the landed behavior.

## Out Of Scope

- Rebalancing ore, shops, hazards, or earthquakes.
- Reworking gameplay, inventory, or modal logic.
- New asset-generation systems or unrelated art overhauls.
- Audio or non-requested visual redesign beyond title/how-to screens.
- Full artifact-chain regeneration beyond intake and work order.

## Inputs

- [00-existing-project-intake.md](/Users/davis.wang/Documents/diggr/docs/project/00-existing-project-intake.md)
- [README.md](/Users/davis.wang/Documents/diggr/README.md)
- [architecture.md](/Users/davis.wang/Documents/diggr/docs/architecture.md)
- [renderers.ts](/Users/davis.wang/Documents/diggr/src/ui/renderers.ts)
- [styles.css](/Users/davis.wang/Documents/diggr/src/styles.css)
- [TitleScene.ts](/Users/davis.wang/Documents/diggr/src/phaser/TitleScene.ts)
- [ui.test.ts](/Users/davis.wang/Documents/diggr/tests/ui.test.ts)

## Artifact Status Inputs

| Artifact | Status | Notes |
| --- | --- | --- |
| `docs/project/00-existing-project-intake.md` | `refresh_required` | Retargeted to the title/how-to art request in this loop. |
| `docs/project/01-work-order.md` | `refresh_required` | Retargeted to the title/how-to art request in this loop. |
| [README.md](/Users/davis.wang/Documents/diggr/README.md) | `refresh_required` | Should mention the sprite-backed title/how-to presentation. |
| [architecture.md](/Users/davis.wang/Documents/diggr/docs/architecture.md) | `refresh_required` | Should capture the sprite-backed DOM title/how-to layer. |
| `Title/how-to renderer + styles` | `refresh_required` | This is the implementation target. |
| `Unrelated gameplay and deploy artifacts` | `out_of_scope` | Preserve unless a regression is introduced. |

## Required Outputs

- Sprite-backed title screen landed in the local browser build.
- Sprite-backed How To Play screen landed in the local browser build.
- Updated intake/work-order artifacts under `docs/project/`.
- Targeted docs refresh in repo-level docs.
- Passing `npm test` and `npm run build`.

## Constraints

- Existing-project mode uses targeted refresh only.
- Preserve existing working behavior unless the request explicitly changes it.
- Browser-first validation and local runnable build remain required.
- Reuse the current sprite sheets and DOM modal/title shell instead of introducing a separate title-specific asset system.

## Escalation Boundary

The owner may choose the exact visual composition, sprite selection, and layout treatment for title/how-to surfaces as long as the current sprite language is reused and existing handlers remain intact. Any change to gameplay behavior or a broader art-direction reset would require escalation.

## Done When

- Title screen uses sprite-backed hero art that reflects the shipped game.
- How To Play uses sprite-backed instructional cards instead of plain text only.
- Repo docs and project artifacts reflect the new behavior.
- Local verification passes.

## Next Owner

- `Producer`
