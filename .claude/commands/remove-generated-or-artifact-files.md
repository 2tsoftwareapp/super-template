---
name: remove-generated-or-artifact-files
description: Workflow command scaffold for remove-generated-or-artifact-files in super-template.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /remove-generated-or-artifact-files

Use this workflow when working on **remove-generated-or-artifact-files** in `super-template`.

## Goal

Removes generated, artifact, or environment-specific files from the repository and updates .gitignore to prevent future commits of such files.

## Common Files

- `.gitignore`
- `packages/extension/artifacts/*`
- `apps/api/storage/exports/*`
- `.mcp.json`
- `skills-lock.json`
- `DESIGN_FEATURES.md`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Identify and delete generated or artifact files from the repository (e.g., logs, CSV exports, scratch files, extension artifacts).
- Update .gitignore to include the relevant directories or file patterns.
- Optionally, update documentation if references to these files exist.

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.