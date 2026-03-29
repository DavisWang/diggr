# Diggr TODO

## Plan

- [x] Add inline documentation in the core runtime modules that carry the hardest-to-rediscover behavior.
- [x] Expand external docs for repo structure, architecture, local workflow, and GitHub Pages deployment.
- [x] Add GitHub Pages deployment automation and Vite base-path handling for project-site deploys.
- [x] Add repo scaffolding needed for a clean GitHub push, including local git initialization on `main`.
- [x] Fix the first-run Pages workflow path so a brand-new repo can bootstrap Pages instead of failing on missing site state.
- [x] Run the full test suite and production build.

## Review

- Added inline documentation to [logic.ts](/Users/davis.wang/Documents/diggr/src/game/logic.ts), [DiggrApp.ts](/Users/davis.wang/Documents/diggr/src/ui/DiggrApp.ts), [rendering.ts](/Users/davis.wang/Documents/diggr/src/phaser/rendering.ts), and [vite.config.ts](/Users/davis.wang/Documents/diggr/vite.config.ts) so the gameplay, app-shell, render-geometry, and deploy-path responsibilities are explicit in code.
- Rewrote [README.md](/Users/davis.wang/Documents/diggr/README.md), expanded [architecture.md](/Users/davis.wang/Documents/diggr/docs/architecture.md), and added [deployment.md](/Users/davis.wang/Documents/diggr/docs/deployment.md) to document the repo shape, runtime boundaries, push checklist, and Pages workflow.
- Added [deploy-pages.yml](/Users/davis.wang/Documents/diggr/.github/workflows/deploy-pages.yml) to build, test, upload, and deploy `dist/` on pushes to `main`, and updated [vite.config.ts](/Users/davis.wang/Documents/diggr/vite.config.ts) so GitHub Actions builds automatically use `/<repo-name>/` as the base path.
- Added [.gitignore](/Users/davis.wang/Documents/diggr/.gitignore) and initialized this folder as a local git repository on `main`, which closes the biggest “not actually pushable” gap that existed before.
- Updated the Pages workflow for first deploys: it now opts actions into Node 24 and asks `actions/configure-pages` to enable Pages automatically when the repo has not been bootstrapped yet.
- Verification:
  - `npm test`
  - `npm run build`
- Residual note: the production build still emits the existing Phaser chunk-size warning. Deployment is still valid; code-splitting is the next optimization pass if load size matters.
