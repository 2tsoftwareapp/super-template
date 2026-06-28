# Contributing

Thanks for your interest in improving this project. This guide covers local setup and the workflow for landing a change.

## Prerequisites

- Node **24.14+** (see `.nvmrc`)
- pnpm **11.7+**
- Docker (provides Postgres, Redis, and Mailpit for local dev)
- Flutter (only if you touch the mobile app)

## Setup

```bash
pnpm bootstrap        # or: make bootstrap
pnpm run env:doctor   # verify toolchain + env files
make dev              # API :3001 · Web :3000 · Admin :3002
```

## Workflow

1. **Branch** off `main`: `git checkout -b type/short-description` (e.g. `feat/invite-flow`, `fix/login-redirect`).
2. **Make your change.** Keep it focused — one logical change per PR.
3. **Regenerate the contract** if you touched API controllers, DTOs, or decorators: `pnpm generate`. Commit the regenerated client.
4. **Validate locally** before pushing:

   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test
   pnpm verify        # db + contract checks
   ```

   For mobile changes: `pnpm run mobile:analyze && pnpm run mobile:test`.
5. **Open a PR** against `main`. Fill out the PR template. CI must be green.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`. Keep the subject under ~72 characters.

## Code style

- Formatting and linting are enforced by `pnpm format` and `pnpm lint`. Run them before pushing.
- Mirror the conventions already present in the area you're editing rather than introducing new patterns.

## Reporting bugs and requesting features

Use the GitHub issue templates. Include reproduction steps, expected vs. actual behavior, and your environment for bugs.
