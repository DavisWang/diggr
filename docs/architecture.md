# Diggr Architecture

## Core shape

- `Phaser` owns rendering, camera, keyboard input, and the game loop.
- `src/game/` owns deterministic world generation, player rules, economy actions, consumable effects, and save-ready state.
- `src/audio/engine.ts` owns procedural background music, synthesized sound FX, browser-safe audio unlock, and the persisted mute state.
- Generated visual assets remain repo-owned source artifacts, not ad hoc outputs: sprite sheets and favicon are regenerated from `scripts/` so browser builds stay in sync with runtime content.
- `src/ui/renderers.ts` owns the title screen, HUD, and modal overlays as plain DOM so UI flows can be regression-tested without driving a real browser.
- The title screen and How To Play modal are sprite-backed DOM surfaces, not separate Phaser UIs, so presentation polish there should stay inside `renderers.ts` and `styles.css`.

## Runtime boundaries

| Layer | Owns | Should not own |
| :-- | :-- | :-- |
| `src/game/logic.ts` | Movement, drilling, economy, modal transitions, survivability, save-safe state updates | Phaser scene objects, DOM, sprite geometry |
| `src/audio/engine.ts` | Music playback, synthesized SFX, loop state, and browser audio lifecycle | Gameplay truth, DOM layout, Phaser rendering |
| `src/game/world.ts` | Seeded terrain generation, chunking, diggable/solid cell helpers | UI or player-facing messaging |
| `src/phaser/GameScene.ts` | Sprite pooling, camera follow, input sampling, per-frame drawing | Canonical gameplay rules |
| `src/phaser/rendering.ts` | Pure render math such as erosion crops and rig offsets | Mutating gameplay state |
| `src/ui/DiggrApp.ts` | Browser shell, persistence, audio routing, app-level hotkeys, scene boot/reboot | Low-level terrain rendering |
| `src/ui/renderers.ts` | Modal/HUD DOM and click targets | Gameplay simulation |

## Key decisions

- World generation is chunked and seeded so saves can restore the same mine layout without precomputing the full depth.
- The digger uses custom collision and movement rules over a tile world instead of leaning on Phaser physics for destructible terrain behavior.
- Shops are surface pads that open modal overlays when the rig settles onto them; gameplay pauses while a modal is open.
- Hidden lava is stored as its own block type but rendered as dirt until revealed through interaction.
- Shop closing can rarely trigger an earthquake event that locks controls briefly and rebuilds only the unseen mine rows below the current browser viewport.

## Timed drilling model

- Starting a drill creates `player.activeDrill` in gameplay state.
- Fuel is charged up front at drill start.
- The target block remains intact until the drill timer completes.
- Render helpers derive erosion crops and digger alignment from `activeDrill` progress.
- The active drill target renders through a dedicated masked full-size terrain sprite in `GameScene` instead of a resized crop from the shared terrain pool. This keeps the source block art intact while the mask reveals the shrinking visible area.
- Drill completion clears the block, resolves rewards/damage, and moves the real player state into the newly opened space.
- Cargo capacity is enforced at drill resolution, not drill start. If the hold is full, the block still breaks and collectible ore is discarded instead of blocking mining.

## Consumable feedback model

- `useConsumable` remains the gameplay source of truth for all item effects.
- Consumable use now also starts a short-lived `activeConsumableEffect` state in gameplay, so the scene can render feedback without inferring item use from toast text or raw input.
- `GameScene` renders those effects through a dedicated sprite-backed FX layer, separate from terrain/drill rendering, so repair, fuel, TNT, transporter, and fissurizer visuals can evolve without changing item mechanics.
- Consumable FX art is generated into `src/assets/sprites/consumable-effects-sheet.png` and selected through pure frame/layout helpers in `src/phaser/rendering.ts`.

## Audio feedback model

- `AudioManager` is app-owned and sits outside gameplay truth, so save data and logic tests stay deterministic.
- `DiggrApp` translates real gameplay transitions into audio cues by diffing state transitions such as drill start/resolve, consumable inventory deltas, damage events, earthquakes, shop entry, and economy actions.
- Continuous textures such as drilling, thrusters, and earthquakes are controlled from app-level state, not from DOM labels or toast strings.
- Audio preference persists separately from save-game state and is exposed through a small always-available corner toggle in the overlay chrome.
- Browser autoplay rules are handled through user-gesture unlock in the app shell before music and sound FX playback starts.

## Earthquake event model

- Closing a dismissible shop modal increments a deterministic close counter on gameplay state.
- A seeded rare-roll check can start `activeEarthquake` after that close, which keeps the event save-safe and testable instead of scene-random.
- Testing mode can also start the same event path explicitly through a dedicated `W` control flag, so debug behavior exercises the real gameplay earthquake code instead of a separate mock path.
- Earthquakes freeze player movement and control handling for their duration, while `GameScene` handles the camera shake once per quake id.
- The world layer rebuilds only rows below `viewportBottomRow + 1`, preserving currently visible terrain and reusing the same seeded generation logic the mine already uses elsewhere.

## Tuning model

- Upgrade stats, consumable prices, ore values, depth bands, and physics constants all live in `src/config/content.ts`.
- Sprite sheets and favicon are generated from `scripts/generateSpriteSheets.mjs` plus the icon-specific generators, then consumed directly by the browser build.
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
