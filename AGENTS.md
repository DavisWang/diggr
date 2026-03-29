# Workspace Instructions

Always use the central Pwner Studios harness at `/Users/davis.wang/Documents/pwner-studios-dev-team` for this project.

## Project Mode

- This repo is an **existing project**, not a greenfield repo.
- Default to the harness existing-project flow, not the new-project flow.
- Use targeted refresh only. Do not rewrite the full artifact chain unless intake shows severe drift between docs, code, and behavior.

## Required Harness Reads

At the start of any non-trivial task, read and apply:

- `/Users/davis.wang/Documents/pwner-studios-dev-team/docs/index.md`
- `/Users/davis.wang/Documents/pwner-studios-dev-team/docs/workflows/game-lifecycle.md`
- `/Users/davis.wang/Documents/pwner-studios-dev-team/docs/contracts/platforms/browser-first.md`
- `/Users/davis.wang/Documents/pwner-studios-dev-team/docs/contracts/roles/producer.md`
- `/Users/davis.wang/Documents/pwner-studios-dev-team/docs/templates/existing-project-intake.md`
- `/Users/davis.wang/Documents/pwner-studios-dev-team/docs/templates/work-order.md`

Also read the current repo context before acting:

- `./README.md`
- existing docs under `./docs/`
- current codebase and active run/test paths

## Producer Workflow

- Act as the **Producer** unless the user explicitly asks for a different role framing.
- Inspect the current repo before delegating or implementing.
- Create or refresh these harness overlay artifacts when they are stale, missing, or directly affected by the request:
  - `./docs/project/00-existing-project-intake.md`
  - `./docs/project/01-work-order.md`
- Intake must capture:
  - current playable state
  - docs reviewed
  - code areas reviewed
  - current run/test commands
  - artifact status as `reusable`, `refresh_required`, `missing`, or `out_of_scope`
  - recommended targeted loop scope

## Delivery Rules

- Preserve existing working behavior unless the request explicitly changes it.
- Run a targeted loop only on stale or request-affected areas.
- Do not return control until the task is complete or a contract-defined escalation is required.
- Whenever a runnable local preview exists, include a clickable local URL in the handoff.
- Whenever returning control to the user, include a flat bullet-point changelog.
