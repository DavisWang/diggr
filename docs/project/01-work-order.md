# Work Order

## Header

- Project: `Diggr`
- Work order ID: `WO-2026-04-01-docs-sync`
- Requester: `Davis Wang`
- Owner: `Producer`
- Project mode: `existing_project`
- Phase: `documentation alignment`
- Active platform profile: `browser-first`

## Objective

Align repository documentation with the landed **internationalization** and **chrome bar** behavior (locale toggle + icon audio), then push an up-to-date `main` to GitHub.

## Requested Change

- Update [README.md](/Users/davis.wang/Documents/diggr/README.md) and [architecture.md](/Users/davis.wang/Documents/diggr/docs/architecture.md) so they describe `src/i18n/`, locale persistence, and the chrome controls accurately.
- Refresh [00-existing-project-intake.md](/Users/davis.wang/Documents/diggr/docs/project/00-existing-project-intake.md) and this work order to reflect the current playable baseline.
- Ensure [i18n-fictional-names.md](/Users/davis.wang/Documents/diggr/docs/i18n-fictional-names.md) remains referenced where useful for localization notes.

## Existing Behavior To Preserve

- All gameplay, audio, save/load, and deployment behavior outside documentation edits.
- Earthquake model (1% shop-close chance, layout reroll) as already implemented in `logic.ts` / `world.ts`.

## In Scope

- Doc and project-artifact edits under `docs/` and root `README.md`.
- Committing and pushing the full set of related code and tests already on the branch (i18n, chrome UI, tests).

## Out Of Scope

- New features, balance changes, or refactors not required for documentation accuracy.
- GitHub Pages workflow changes unless deployment breaks.

## Inputs

- Current `main` tree: `src/i18n/`, `src/ui/DiggrApp.ts`, `src/ui/renderers.ts`, `src/styles.css`, tests.

## Required Outputs

- Updated README, architecture, intake, and work order.
- Passing `npm test` and `npm run build`.
- `main` pushed to `origin`.

## Done When

- Documentation matches the chrome bar and i18n implementation.
- Tests and build succeed locally.
- Changes are on GitHub.

## Next Owner

- `Producer`
