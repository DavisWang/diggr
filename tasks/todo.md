# Diggr TODO

## Plan

- [x] Capture existing-project intake and work order for the consumable-animation request.
- [x] Add a gameplay-owned consumable effect state without changing current consumable mechanics.
- [x] Render distinct consumable-use animations in the Phaser scene.
- [x] Add targeted regression coverage and refresh the affected docs.
- [x] Rerun verification.

## Review

- Consumable use now has a clean gameplay-to-render contract: item mechanics still resolve in `logic.ts`, while `GameScene` reads a short-lived effect state to draw repair, fuel, blast, transport, and fissure feedback without coupling visuals to toast text or hotkey handling.
