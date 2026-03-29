# Work Order

## Header

- Project: `Diggr`
- Work order ID: `WO-2026-03-29-consumable-fx`
- Requester: `Davis Wang`
- Owner: `Producer`
- Project mode: `existing_project`
- Phase: `brownfield work order`
- Active platform profile: `browser-first`

## Objective

Add in-world use animations for consumable items so the player gets immediate visual feedback when triggering repair, refuel, explosive, and teleport-style consumables. The implementation should be additive, preserve the current gameplay results, and use a targeted refresh limited to the stale/request-affected code and docs.

## Requested Change

Add animations for using consumable items, using creative liberty based on each item description.

## Existing Behavior To Preserve

- Consumable hotkeys and inventory usage remain unchanged.
- Repair and fuel items still apply their current numeric effects instantly.
- TNT items still cancel active drilling and clear their current blast areas.
- Teleport items still move the rig to their current destinations with the same immediate gameplay outcome.
- Existing shop, inventory, digging, save/load, and HUD behavior should remain intact.

## In Scope

- Add a canonical consumable-effect state to gameplay.
- Render distinct use animations for each consumable family in the Phaser scene.
- Add targeted regression coverage for effect-state creation/expiry and visual-family mapping.
- Refresh the minimal docs required for the landed behavior.

## Out Of Scope

- Rebalancing consumable prices or item stats.
- Adding new consumable items.
- Reworking consumable shop layout or controls.
- Audio, particle-system infrastructure, or sprite-sheet authoring for this pass.
- Full artifact-chain regeneration beyond intake and work order.

## Inputs

- [00-existing-project-intake.md](/Users/davis.wang/Documents/diggr/docs/project/00-existing-project-intake.md)
- [README.md](/Users/davis.wang/Documents/diggr/README.md)
- [architecture.md](/Users/davis.wang/Documents/diggr/docs/architecture.md)
- [logic.ts](/Users/davis.wang/Documents/diggr/src/game/logic.ts)
- [GameScene.ts](/Users/davis.wang/Documents/diggr/src/phaser/GameScene.ts)
- [rendering.ts](/Users/davis.wang/Documents/diggr/src/phaser/rendering.ts)
- [logic.test.ts](/Users/davis.wang/Documents/diggr/tests/logic.test.ts)
- [rendering.test.ts](/Users/davis.wang/Documents/diggr/tests/rendering.test.ts)

## Artifact Status Inputs

| Artifact | Status | Notes |
| --- | --- | --- |
| `docs/project/00-existing-project-intake.md` | `reusable` | Created in this loop and remains the canonical brownfield intake. |
| `docs/project/01-work-order.md` | `reusable` | Canonical scoped work packet for this loop. |
| [README.md](/Users/davis.wang/Documents/diggr/README.md) | `refresh_required` | Needs feature summary refresh after implementation. |
| [architecture.md](/Users/davis.wang/Documents/diggr/docs/architecture.md) | `refresh_required` | Needs runtime contract refresh for consumable effects. |
| `Consumable gameplay/render code` | `refresh_required` | This is the implementation target. |
| `Unrelated economy/shop/deploy artifacts` | `out_of_scope` | Preserve unless a regression is introduced. |

## Required Outputs

- Distinct consumable-use animations landed in the local browser build.
- Updated intake/work-order artifacts under `docs/project/`.
- Targeted docs refresh in repo-level docs.
- Passing `npm test` and `npm run build`.

## Constraints

- Existing-project mode uses targeted refresh only.
- Preserve existing working behavior unless the request explicitly changes it.
- Browser-first validation and local runnable build remain required.
- Keep the implementation data-driven and testable instead of burying timers inside raw scene code.

## Escalation Boundary

The owner may choose the visual treatment, timing, and rendering geometry for each consumable animation. Any change to item mechanics, hotkey scheme, platform assumptions, or broader UI flows would require escalation.

## Done When

- Each consumable family has a visible, distinct use animation in the Phaser scene.
- Consumable mechanical outcomes still match prior behavior.
- Effect state creation and expiry are covered by tests.
- Repo docs and project artifacts reflect the new behavior.
- Local verification passes.

## Next Owner

- `Producer`
