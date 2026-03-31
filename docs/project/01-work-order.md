# Work Order

## Header

- Project: `Diggr`
- Work order ID: `WO-2026-03-31-earthquake-retune`
- Requester: `Davis Wang`
- Owner: `Producer`
- Project mode: `existing_project`
- Phase: `brownfield work order`
- Active platform profile: `browser-first`

## Objective

Add a targeted earthquake-tuning pass that lowers shop-close quake frequency and makes each quake regenerate the underground as a genuinely new mine layout. The implementation must stay inside a targeted refresh limited to request-affected gameplay logic, world-generation state, tests, and docs.

## Requested Change

Reduce shop-close earthquake chance to `1%` and change earthquake regeneration so it no longer rebuilds from the same underground layout seed.

## Existing Behavior To Preserve

- Current gameplay state, economy, hazards, save/load, shops, audio, HUD, and control flow remain intact outside the quake path.
- Existing testing-mode quake trigger remains intact.
- Current title/how-to presentation remains intact aside from copy updates that describe the quake behavior correctly.
- Deterministic save-safe behavior remains intact; regenerated underground state must persist across save/load.

## In Scope

- Lower `EARTHQUAKE_SHOP_CLOSE_CHANCE` to `1%`.
- Change earthquake regeneration to reroll the underground layout instead of rebuilding from the same seed.
- Keep the current quake duration, lockout, and testing-mode trigger path unless implementation evidence forces a narrower adjustment.
- Add targeted regression coverage and refresh the minimal docs required for the landed behavior.

## Out Of Scope

- Broader balance changes outside the requested earthquake tuning.
- Reworking audio, UI, or unrelated world-generation systems.
- New gameplay events, new hazards, or visual redesigns for the quake event.
- Full artifact-chain regeneration beyond intake and work order.

## Inputs

- [00-existing-project-intake.md](/Users/davis.wang/Documents/diggr/docs/project/00-existing-project-intake.md)
- [README.md](/Users/davis.wang/Documents/diggr/README.md)
- [architecture.md](/Users/davis.wang/Documents/diggr/docs/architecture.md)
- [logic.ts](/Users/davis.wang/Documents/diggr/src/game/logic.ts)
- [world.ts](/Users/davis.wang/Documents/diggr/src/game/world.ts)
- [content.ts](/Users/davis.wang/Documents/diggr/src/config/content.ts)
- [GameScene.ts](/Users/davis.wang/Documents/diggr/src/phaser/GameScene.ts)
- [renderers.ts](/Users/davis.wang/Documents/diggr/src/ui/renderers.ts)
- [logic.test.ts](/Users/davis.wang/Documents/diggr/tests/logic.test.ts)

## Artifact Status Inputs

| Artifact | Status | Notes |
| --- | --- | --- |
| `docs/project/00-existing-project-intake.md` | `refresh_required` | Retargeted to the earthquake tuning loop. |
| `docs/project/01-work-order.md` | `refresh_required` | Retargeted to the earthquake tuning loop. |
| [README.md](/Users/davis.wang/Documents/diggr/README.md) | `refresh_required` | Earthquake feature summary is stale. |
| [architecture.md](/Users/davis.wang/Documents/diggr/docs/architecture.md) | `refresh_required` | Earthquake model section is stale. |
| `Earthquake logic and world generation` | `refresh_required` | Chance and regeneration-seed behavior must change together. |
| `Earthquake regression coverage` | `refresh_required` | Logic tests currently pin the old contract. |
| `Unrelated audio/UI/deploy artifacts` | `out_of_scope` | Preserve unless the quake change exposes a regression. |

## Required Outputs

- Earthquakes trigger only `1%` of the time on shop close.
- Earthquakes regenerate the underground from a genuinely new layout seed.
- Testing-mode earthquake triggering still hits the same regenerated-world path.
- Updated intake/work-order artifacts under `docs/project/`.
- Targeted docs refresh in repo-level docs.
- Passing `npm test` and `npm run build`.
- Clickable local preview URL for the implemented build.

## Constraints

- Existing-project mode uses targeted refresh only.
- Preserve existing working behavior unless the request explicitly changes it.
- Browser-first validation and local runnable build remain required.
- Keep quake behavior save-safe and deterministic once it has been triggered.
- Avoid broad changes to world generation outside the earthquake regeneration path.

## Escalation Boundary

The owner may choose the exact deterministic reroll strategy and test shape as long as the user-visible behavior matches `1%` chance plus a genuinely new underground layout. Any broader balance retune, audio change, or quake redesign beyond those constraints would require escalation.

## Done When

- Shop-close quake chance is `1%`.
- Earthquake regeneration no longer restores the same deterministic block layout.
- Repo docs and project artifacts reflect the new behavior.
- Local verification passes and a preview URL is available.

## Next Owner

- `Producer`
