---
name: fix-lint-or-type-errors-monorepo-wide
description: Workflow command scaffold for fix-lint-or-type-errors-monorepo-wide in super-template.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /fix-lint-or-type-errors-monorepo-wide

Use this workflow when working on **fix-lint-or-type-errors-monorepo-wide** in `super-template`.

## Goal

Resolves lint or type errors across multiple packages or apps to restore passing status for linting and verification scripts.

## Common Files

- `eslint.config.mjs`
- `packages/*/src/**/*.ts`
- `apps/*/src/**/*.ts`
- `apps/*/vitest.config.ts`
- `packages/*/package.json`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Identify lint/type errors via CI or local scripts.
- Update source files to fix lint/type issues (e.g., type/interface changes, import ordering, export maps).
- Update or add eslint/vitest config as needed to ignore or include files.
- Run lint/verify scripts to confirm all errors are resolved.

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.