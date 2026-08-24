---
name: add-or-update-tests-for-core-modules
description: Workflow command scaffold for add-or-update-tests-for-core-modules in super-template.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /add-or-update-tests-for-core-modules

Use this workflow when working on **add-or-update-tests-for-core-modules** in `super-template`.

## Goal

Adds or updates unit or e2e tests for core modules/packages, often in response to coverage gaps or new features.

## Common Files

- `packages/*/src/**/*.spec.ts`
- `apps/api/vitest.config.ts`
- `apps/api/package.json`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Identify core modules/packages lacking tests or with uncovered logic.
- Create new test files (e.g., .spec.ts) or update existing ones.
- Update test runner configuration (e.g., vitest config, package.json test scripts) to include new test paths.
- Verify that tests are picked up and run in CI or local scripts.

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.