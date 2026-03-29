# Diggr TODO

## Plan

- [x] Refresh the existing-project intake and work order for the title/how-to art request.
- [x] Rebuild the title screen with sprite-backed hero art using the current game sheets.
- [x] Rebuild the How To Play screen with sprite-backed instructional cards.
- [x] Add targeted regression coverage and refresh the affected docs.
- [x] Rerun verification.

## Review

- The title screen now uses the live sprite language as a real hero composition instead of relying on text plus a generic backdrop.
- The How To Play screen now teaches the loop with sprite-backed cards, which makes the surface shops, hazards, and consumables legible at a glance.
- The implementation stays inside the existing DOM renderer and CSS layer, so gameplay code and modal handlers were preserved.
