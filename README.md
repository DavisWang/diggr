# Diggr

Browser-based 2D digging RPG prototype built with `Phaser 3 + TypeScript + Vite`.

## What it is

Diggr is a desktop-first mining prototype with:

- deterministic chunked world generation
- timed drilling with directional erosion animation
- consumable-use animations for repair, fuel, explosives, and teleport tools
- full-cargo mining that still destroys blocks and discards ore if the hold is already full
- gravity, fuel burn, lava damage, and fall damage
- surface shops for upgrades, consumables, refining, and service
- local save/load through `localStorage`
- DOM-based HUD and modals layered over a Phaser scene

## Repo map

| Path | Purpose |
| :-- | :-- |
| `src/game/` | Pure gameplay rules, economy, movement, drilling, and state transitions |
| `src/phaser/` | Phaser scenes plus pure render helpers for sprite/layout geometry |
| `src/ui/` | DOM overlays for HUD, shops, inventory, title, and game-over screens |
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
| `npm test` | Run the regression suite |

## Development model

| Layer | Responsibility |
| :-- | :-- |
| `logic.ts` | Owns gameplay truth; Phaser should not duplicate rules here |
| `rendering.ts` | Converts gameplay state into render geometry that can be unit-tested |
| `DiggrApp.ts` | Owns browser shell concerns: Phaser boot, overlays, persistence, app-level hotkeys |
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
- The repo was not originally initialized as git in this local folder, so GitHub push readiness depends on local git setup as well as the workflow files.
