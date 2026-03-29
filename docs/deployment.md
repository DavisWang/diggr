# GitHub Pages Deployment

## What is configured

| Piece | Purpose |
| :-- | :-- |
| `.github/workflows/deploy-pages.yml` | Builds, tests, uploads `dist/`, and deploys on pushes to `main` |
| `vite.config.ts` | Switches Vite `base` to `/<repo-name>/` automatically inside GitHub Actions |
| `README.md` | Documents local commands and the push/deploy flow |

## Assumptions

- This project will be deployed as a GitHub Pages project site, not a user/org root site.
- The default branch is `main`.
- Deployment should happen from GitHub Actions, not from a local `gh-pages` branch.

## First-time setup in GitHub

1. Create or connect a GitHub repository for this folder.
2. Push the repo to GitHub with `main` as the default branch.
3. Push to `main` or run the workflow manually from the `Actions` tab.
4. The workflow will attempt to bootstrap Pages automatically through `actions/configure-pages`.
5. If GitHub still asks for a source in `Settings -> Pages`, set it to `GitHub Actions`.

## Expected deploy behavior

| Event | Result |
| :-- | :-- |
| Push to `main` | Runs tests, builds the site, deploys `dist/` to GitHub Pages |
| Manual workflow dispatch | Same build/deploy path without a code push |
| Local `npm run dev` | Uses `/` as the base path |
| GitHub Actions build | Uses `/<repo-name>/` as the base path |
| First deploy on a new repo | Tries to enable Pages automatically before upload/deploy |

## Pre-push checklist

- `npm test`
- `npm run build`
- Confirm the repo name is the intended public Pages URL slug
- Confirm `main` is the branch you want to deploy from

## Known limitation

- The production bundle still triggers a Phaser chunk-size warning. It does not block deployment, but code-splitting is the next optimization pass if load size matters.
