# Diggr TODO

## Plan

- [x] Inspect the current quake probability and regeneration path in gameplay logic and world generation.
- [x] Refresh the existing-project intake and work order for the earthquake tuning request.
- [x] Lower shop-close earthquake chance to `1%` and reroll the underground layout seed on quake.
- [x] Update targeted logic coverage and stale docs/copy for the new quake behavior.
- [x] Rerun verification and capture the local preview handoff.

## Review

- Producer artifacts now match the earthquake tuning request instead of the prior audio loop.
- Earthquake chance is now retuned from `5%` to `1%`, and quake regeneration rerolls the underground layout seed instead of replaying the same mined block pattern.
- Upgrade shop now defaults to drills instead of hulls, so the main progression category is surfaced first.
- Targeted tests and docs have been refreshed around the quake path.
- Verification passed on `2026-03-31` with `npm test` (`94` tests) and `npm run build`.
