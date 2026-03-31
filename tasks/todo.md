# Diggr TODO

## Plan

- [x] Inspect the current repo, harness docs, request-affected code paths, and verification commands for the audio loop.
- [x] Refresh the existing-project intake and work order for the audio/music request.
- [x] Get approval on the proposed music and sound-FX inventory.
- [x] Implement the audio runtime, toggle, persistence, and approved cue set.
- [x] Add targeted regression coverage and refresh the affected docs.
- [x] Rerun verification and capture the local preview handoff.

## Review

- Producer artifacts now match the audio/music request instead of the prior title/how-to art loop.
- Landed an app-owned procedural audio runtime with one retro lo-fi music loop, synthesized SFX, persisted mute preference, and a small overlay toggle.
- Wired discrete cues to gameplay and economy transitions while keeping gameplay rules pure and save state unchanged.
- Verification passed on `2026-03-31` with `npm test` (`93` tests) and `npm run build`.
