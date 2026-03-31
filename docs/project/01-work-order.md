# Work Order

## Header

- Project: `Diggr`
- Work order ID: `WO-2026-03-31-audio-pass`
- Requester: `Davis Wang`
- Owner: `Producer`
- Project mode: `existing_project`
- Phase: `brownfield work order`
- Active platform profile: `browser-first`

## Objective

Add a targeted audio pass that introduces retro background music, gameplay sound FX, and an unobtrusive always-available audio toggle without changing the current gameplay loop. The implementation must stay inside a targeted refresh limited to request-affected audio/runtime/UI code, tests, and docs, and must honor the explicit proposal checkpoint before gameplay changes begin.

## Requested Change

Add a retro, low-fi, rhythmic background loop of roughly `30` seconds, add sound FX for the gameplay and economy actions called out in the request plus the missing high-signal events identified during intake, and place a small inconspicuous corner control somewhere in the overlay to toggle all audio on/off.

## Existing Behavior To Preserve

- Current gameplay state, economy, hazards, save/load, shops, and HUD behavior remain intact.
- Existing Phaser scene and DOM overlay boundaries remain intact; audio should fit into the current app shell rather than forcing a new runtime architecture.
- Current title/how-to presentation remains intact except for adding the small audio toggle where needed.
- Keyboard controls, testing mode hooks, and deterministic gameplay rules remain intact.

## In Scope

- Add an app-owned audio runtime with browser-safe unlock behavior and persisted on/off preference.
- Add one retro background loop for title/gameplay use.
- Add the approved sound-FX set for gameplay, economy, hazard, and utility events.
- Add a small corner audio toggle that is available in the title and gameplay flows.
- Add targeted regression coverage and refresh the minimal docs required for the landed behavior.

## Out Of Scope

- Rebalancing ore, shops, hazards, earthquakes, or progression values.
- A broader UI redesign beyond fitting the requested audio toggle into the current overlay shell.
- Multiple soundtrack tracks, adaptive score systems, or separate music-vs-SFX controls unless the user expands scope.
- External licensing/sourcing work for third-party audio libraries; assets should stay repo-owned and local.
- Full artifact-chain regeneration beyond intake and work order.

## Inputs

- [00-existing-project-intake.md](/Users/davis.wang/Documents/diggr/docs/project/00-existing-project-intake.md)
- [README.md](/Users/davis.wang/Documents/diggr/README.md)
- [architecture.md](/Users/davis.wang/Documents/diggr/docs/architecture.md)
- [storage.ts](/Users/davis.wang/Documents/diggr/src/lib/storage.ts)
- [main.ts](/Users/davis.wang/Documents/diggr/src/main.ts)
- [logic.ts](/Users/davis.wang/Documents/diggr/src/game/logic.ts)
- [content.ts](/Users/davis.wang/Documents/diggr/src/config/content.ts)
- [GameScene.ts](/Users/davis.wang/Documents/diggr/src/phaser/GameScene.ts)
- [TitleScene.ts](/Users/davis.wang/Documents/diggr/src/phaser/TitleScene.ts)
- [renderers.ts](/Users/davis.wang/Documents/diggr/src/ui/renderers.ts)
- [styles.css](/Users/davis.wang/Documents/diggr/src/styles.css)
- [app.test.ts](/Users/davis.wang/Documents/diggr/tests/app.test.ts)
- [logic.test.ts](/Users/davis.wang/Documents/diggr/tests/logic.test.ts)
- [ui.test.ts](/Users/davis.wang/Documents/diggr/tests/ui.test.ts)

## Artifact Status Inputs

| Artifact | Status | Notes |
| --- | --- | --- |
| `docs/project/00-existing-project-intake.md` | `refresh_required` | Retargeted to the audio/music loop. |
| `docs/project/01-work-order.md` | `refresh_required` | Retargeted to the audio/music loop. |
| [README.md](/Users/davis.wang/Documents/diggr/README.md) | `refresh_required` | Should mention shipped audio behavior after landing. |
| [architecture.md](/Users/davis.wang/Documents/diggr/docs/architecture.md) | `refresh_required` | Should capture the audio ownership boundary after landing. |
| `Audio runtime and persistence` | `missing` | No audio manager or preference storage exists yet. |
| `Cue event wiring and overlay toggle` | `missing` | No audio events or audio control surface exist yet. |
| `Audio regression coverage` | `missing` | No tests cover the requested behavior. |
| `Unrelated gameplay and deploy artifacts` | `out_of_scope` | Preserve unless an audio regression exposes a deeper issue. |

## Required Outputs

- Approved proposal for the music/SFX inventory before gameplay implementation starts.
- Retro background loop and approved SFX set landed in the local browser build.
- Corner audio toggle landed in the title/gameplay overlay and preference persists across reloads.
- Updated intake/work-order artifacts under `docs/project/`.
- Targeted docs refresh in repo-level docs.
- Passing `npm test` and `npm run build`.
- Clickable local preview URL for the implemented build.

## Constraints

- Existing-project mode uses targeted refresh only.
- Preserve existing working behavior unless the request explicitly changes it.
- Browser-first validation and local runnable build remain required.
- Respect browser autoplay constraints; audio must unlock through a real user gesture path.
- Use one audio toggle for both music and SFX unless the user changes the request.

## Escalation Boundary

The owner may choose the exact cue timing, sonic palette, volume balance, and repo-local implementation approach as long as the result fits the requested retro low-fi brief and preserves current behavior. User approval is required on the proposed cue inventory before gameplay/UI implementation begins, because the request explicitly asks for a proposal checkpoint first. Separate music/SFX controls, a materially different sonic direction, or external third-party asset sourcing would require escalation.

## Done When

- The user has approved the proposed music/SFX inventory.
- Title and gameplay both expose an inconspicuous audio toggle.
- The approved music loop and SFX cues play on the intended state transitions without changing gameplay behavior.
- Audio preference persists across reloads.
- Repo docs and project artifacts reflect the new behavior.
- Local verification passes and a preview URL is available.

## Next Owner

- `User`
