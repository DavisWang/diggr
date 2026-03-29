# Diggr Architecture

## Core shape

- `Phaser` owns rendering, camera, keyboard input, and the game loop.
- `src/game/` owns deterministic world generation, player rules, economy actions, consumable effects, and save-ready state.
- `src/ui/renderers.ts` owns the title screen, HUD, and modal overlays as plain DOM so UI flows can be regression-tested without driving a real browser.

## Runtime boundaries

| Layer | Owns | Should not own |
| :-- | :-- | :-- |
| `src/game/logic.ts` | Movement, drilling, economy, modal transitions, survivability, save-safe state updates | Phaser scene objects, DOM, sprite geometry |
| `src/game/world.ts` | Seeded terrain generation, chunking, diggable/solid cell helpers | UI or player-facing messaging |
| `src/phaser/GameScene.ts` | Sprite pooling, camera follow, input sampling, per-frame drawing | Canonical gameplay rules |
| `src/phaser/rendering.ts` | Pure render math such as erosion crops and rig offsets | Mutating gameplay state |
| `src/ui/DiggrApp.ts` | Browser shell, persistence, app-level hotkeys, scene boot/reboot | Low-level terrain rendering |
| `src/ui/renderers.ts` | Modal/HUD DOM and click targets | Gameplay simulation |

## Key decisions

- World generation is chunked and seeded so saves can restore the same mine layout without precomputing the full depth.
- The digger uses custom collision and movement rules over a tile world instead of leaning on Phaser physics for destructible terrain behavior.
- Shops are surface pads that open modal overlays when the rig settles onto them; gameplay pauses while a modal is open.
- Hidden lava is stored as its own block type but rendered as dirt until revealed through interaction.

## Timed drilling model

- Starting a drill creates `player.activeDrill` in gameplay state.
- Fuel is charged up front at drill start.
- The target block remains intact until the drill timer completes.
- Render helpers derive erosion crops and digger alignment from `activeDrill` progress.
- Drill completion clears the block, resolves rewards/damage, and moves the real player state into the newly opened space.

## Tuning model

- Upgrade stats, consumable prices, ore values, depth bands, and physics constants all live in `src/config/content.ts`.
- The numbers are meant to be playable defaults, not final balance.
- Future tuning should change config data first before changing gameplay code.

## Deployment model

- The production app builds through `vite build`.
- GitHub Pages deploys through `.github/workflows/deploy-pages.yml`.
- `vite.config.ts` detects GitHub Actions and switches `base` to `/<repo-name>/` automatically so local dev can still run from `/`.

## Verification

- `npm test` covers deterministic generation, dig rules, cargo/economy behavior, consumables, save/load, and modal/UI rendering.
- `npm run build` passes and produces a playable bundle.
- Current build warning is bundle size from Phaser; functionality is intact, but code-splitting is the next optimization pass if load size matters.
