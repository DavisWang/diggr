# Work Order

## Header

- Project: `Diggr`
- Work order ID: `WO-2026-03-29-ga-polish`
- Requester: `Davis Wang`
- Owner: `Producer`
- Project mode: `existing_project`
- Phase: `brownfield work order`
- Active platform profile: `browser-first`

## Objective

Add a targeted GA-polish pass that introduces a testing-only manual earthquake hotkey, regenerates all shipped sprite sheets plus a favicon from source, and refreshes docs so the project is described as a GA-ready browser game instead of a prototype. The implementation should preserve current gameplay behavior and stay within a targeted refresh limited to the request-affected code, assets, and docs.

## Requested Change

Add a testing-mode hotkey `W` that manually triggers the real earthquake path, add a favicon, regenerate all sprite sheets so the checked-in assets match the current game, and update the docs to position Diggr as GA-ready rather than a prototype.

## Existing Behavior To Preserve

- Existing earthquake behavior remains intact for non-testing gameplay.
- World generation remains seeded and deterministic.
- Current sprite language and approved icon direction should be preserved while regenerating from source.
- Current digging, consumables, save/load, shops, and HUD behavior should remain intact.

## In Scope

- Add a testing-only manual input hook for the existing earthquake system.
- Regenerate runtime sprite sheets and browser-facing favicon from repo scripts.
- Add targeted regression coverage for the new testing control.
- Refresh the minimal docs required for the landed behavior and GA-ready positioning.

## Out Of Scope

- Rebalancing ore, shops, hazards, or earthquake odds.
- Redesigning the current shop UI or art direction.
- Reworking the visible mine or introducing whole-world rerolls.
- Audio or non-requested visual redesign.
- Full artifact-chain regeneration beyond intake and work order.

## Inputs

- [00-existing-project-intake.md](/Users/davis.wang/Documents/diggr/docs/project/00-existing-project-intake.md)
- [README.md](/Users/davis.wang/Documents/diggr/README.md)
- [architecture.md](/Users/davis.wang/Documents/diggr/docs/architecture.md)
- [logic.ts](/Users/davis.wang/Documents/diggr/src/game/logic.ts)
- [GameScene.ts](/Users/davis.wang/Documents/diggr/src/phaser/GameScene.ts)
- [index.html](/Users/davis.wang/Documents/diggr/index.html)
- [generateSpriteSheets.mjs](/Users/davis.wang/Documents/diggr/scripts/generateSpriteSheets.mjs)
- [package.json](/Users/davis.wang/Documents/diggr/package.json)
- [logic.test.ts](/Users/davis.wang/Documents/diggr/tests/logic.test.ts)
- [app.test.ts](/Users/davis.wang/Documents/diggr/tests/app.test.ts)

## Artifact Status Inputs

| Artifact | Status | Notes |
| --- | --- | --- |
| `docs/project/00-existing-project-intake.md` | `refresh_required` | Retargeted to the GA-polish request in this loop. |
| `docs/project/01-work-order.md` | `refresh_required` | Retargeted to the GA-polish request in this loop. |
| [README.md](/Users/davis.wang/Documents/diggr/README.md) | `refresh_required` | Needs GA-ready positioning and asset-pipeline command refresh. |
| [architecture.md](/Users/davis.wang/Documents/diggr/docs/architecture.md) | `refresh_required` | Needs manual-testing hook and generator ownership refresh. |
| `Testing control + asset generators` | `refresh_required` | This is the implementation target. |
| `Unrelated economy/shop/deploy artifacts` | `out_of_scope` | Preserve unless a regression is introduced. |

## Required Outputs

- Testing-only `W` earthquake trigger landed in the local browser build.
- Regenerated sprite sheets and favicon landed from source scripts.
- Updated intake/work-order artifacts under `docs/project/`.
- Targeted docs refresh in repo-level docs.
- Passing `npm test` and `npm run build`.

## Constraints

- Existing-project mode uses targeted refresh only.
- Preserve existing working behavior unless the request explicitly changes it.
- Browser-first validation and local runnable build remain required.
- The testing hook must call the real earthquake gameplay path rather than a debug-only fake implementation.

## Escalation Boundary

The owner may choose the exact testing hotkey plumbing, favicon treatment, and asset-generation workflow as long as it stays browser-first, reproducible, and preserves current behavior. Any change to gameplay balance, visual direction, or release stack would require escalation.

## Done When

- Testing mode can manually trigger the real earthquake path.
- Runtime sprite sheets and favicon regenerate cleanly from repo scripts.
- Repo docs and project artifacts reflect the new behavior.
- Local verification passes.

## Next Owner

- `Producer`
