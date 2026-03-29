# Diggr TODO

## Plan

- [x] Refresh the existing-project intake and work order for the GA-polish request.
- [x] Add a testing-only `W` hotkey that triggers the real earthquake path.
- [x] Regenerate runtime sprite sheets and add a favicon from source scripts.
- [x] Add targeted regression coverage and refresh the affected docs.
- [x] Rerun verification.

## Review

- Testing mode now exercises the real earthquake logic through a dedicated `W` control flag instead of a parallel debug path, so QA can validate the same regeneration and lockout rules the live game uses.
- The generated asset pipeline is back in sync with the shipped browser build, including the fifth surface-shop sprite for the save balloon and a browser favicon.
- Repo docs now describe Diggr as a GA-ready browser game and call out the reproducible asset-generation workflow.
