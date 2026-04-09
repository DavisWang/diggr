# Diggr

Browser-based 2D digging RPG built for GA-ready browser release on `Phaser 3 + TypeScript + Vite`.

## What it is

Diggr is a desktop-first mining game with:

- deterministic chunked world generation
- timed drilling with directional erosion animation
- procedural retro lo-fi background music with synthesized gameplay sound FX
- English and Simplified Chinese UI (`src/i18n/`) with locale preference in `localStorage`
- bottom-right chrome bar: single locale toggle (globe + active language badge) and icon-only audio mute for music and SFX
- sprite-backed consumable-use animations for repair, fuel, explosives, and teleport tools
- rare post-shop earthquakes that shake the camera, lock controls briefly, and fully regenerate the underground with a new layout
- upgrade shop opens on drills by default so the primary progression path is surfaced first
- testing mode support, including a manual `W` hotkey for earthquake validation
- sprite-backed title and How To Play presentation that reuse the live game art language
- full-cargo mining that still destroys blocks and discards ore if the hold is already full
- gravity, fuel burn, lava damage, and fall damage
- surface shops for upgrades, consumables, refining, and service
- local save/load through `localStorage`
- generated sprite sheets and favicon that are reproducible from repo scripts
- DOM-based HUD and modals layered over a Phaser scene

## Repo map

| Path | Purpose |
| :-- | :-- |
| `src/game/` | Pure gameplay rules, economy, movement, drilling, and state transitions |
| `src/audio/` | App-owned procedural music and synthesized sound FX runtime |
| `src/phaser/` | Phaser scenes plus pure render helpers for sprite/layout geometry |
| `src/ui/` | DOM overlays for HUD, shops, inventory, title, and game-over screens |
| `src/i18n/` | UI strings, locale helpers, and zh game copy for blocks, shops, upgrades, and consumables |
| `docs/i18n-fictional-names.md` | Notes on translating spoof tier and ore names for Chinese |
| `docs/i18n-audit.md` | Where strings are localized, gaps, and toast/i18n behavior |
| `src/config/content.ts` | Balance, physics constants, shop pads, item defs, and render tuning |
| `docs/architecture.md` | Architectural model and key design decisions |
| `docs/deployment.md` | GitHub Pages deployment instructions |
| `.github/workflows/deploy-pages.yml` | GitHub Actions workflow for Pages deploys |
| `tests/` | Logic, rendering, UI, keyboard, world, and app-shell regressions |

## Local commands

| Command | Purpose |
| :-- | :-- |
| `npm install` | Install dependencies |
| `npm run dev` | Start the local dev server |
| `npm run build` | Type-check and build production assets |
| `npm run preview` | Preview the production build locally |
| `npm run generate:assets` | Regenerate terrain, digger, shop, effect, icon, and favicon assets |
| `npm test` | Run the regression suite |

## Development model

| Layer | Responsibility |
| :-- | :-- |
| `logic.ts` | Owns gameplay truth; Phaser should not duplicate rules here |
| `engine.ts` | Owns browser-safe audio unlock, loop playback, synthesized cues, and mute state |
| `rendering.ts` | Converts gameplay state into render geometry that can be unit-tested |
| `DiggrApp.ts` | Owns browser shell concerns: Phaser boot, overlays, persistence, audio routing, app-level hotkeys |
| `renderers.ts` | Owns HTML modal and HUD rendering so click flows can be tested without browser automation |

## GitHub Pages

This repo is configured for GitHub Pages deployment through GitHub Actions.

| File | Role |
| :-- | :-- |
| `vite.config.ts` | Automatically switches Vite `base` for GitHub Pages project-site deploys |
| `.github/workflows/deploy-pages.yml` | Runs tests, builds `dist/`, uploads artifact, deploys Pages |
| `docs/deployment.md` | First-time GitHub setup and deploy checklist |

## Push checklist

1. Run `npm test`.
2. Run `npm run build`.
3. Confirm the repo is on GitHub with `main` as the default branch.
4. Push `main`.
5. Watch the `Deploy GitHub Pages` workflow in the Actions tab.

## Notes

- The project currently is not optimized for bundle size; Phaser still triggers a production chunk-size warning.
- Audio is generated locally in-browser through the Web Audio API, so the shipped build does not depend on third-party music or SFX files.
- The repo was not originally initialized as git in this local folder, so GitHub push readiness depends on local git setup as well as the workflow files.
