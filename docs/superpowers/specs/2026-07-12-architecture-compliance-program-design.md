# Architecture Compliance Program — Design

Date: 2026-07-12
Status: Approved (execution in progress)
Canonical rule source: `docs/architecture/ARCHITECTURE_RULES.md`
Companion analysis: `DESIGN.md`, `.agents/skills/clean-code/SKILL.md`

## Goal

Bring the entire repository into compliance with the canonical architecture
rules, sequentially, **core-first**, one module per commit on `main`. This is a
compliance-and-cleanup pass, not a from-scratch restructure — the
`presentation/application/domain/infrastructure` (backend) and
`features/<x>/components` (frontend) skeletons already exist.

## Working agreement

- Sequential, core-first, module-by-module.
- One commit per module/unit directly on `main`.
- Run continuously through all phases; only stop on a real error or a decision
  that is the user's to make.
- Verify each unit with the narrowest relevant commands before committing
  (`pnpm --filter <pkg> lint|typecheck|test`), then repo-wide checks per phase.
- Never claim a check passed without running it.

## What "compliance" means (per ARCHITECTURE_RULES.md)

Backend:
- Controllers inject use cases directly; no pass-through `FeatureService`.
- Ports live in `application/ports/`; infra implements them.
- DTOs (presentation) ≠ commands/queries (application) ≠ DB rows.
- Domain is framework-free; only exists where a real rule exists.
- No cross-context deep imports; only via `api-core` kernel / stable ports.

Frontend:
- Route → screen → controller hook → queries/mutations → api functions → ui.
- Only `features/*/api/*.api.ts` + shared http may call `webFetch`.
- UI is presentational (props in, callbacks out); no HTTP/RQ/session/URL/permission strings.
- Shared primitives only from `@repo/web-core/components/*`.
- Query-key factories; URL owns shareable list state.

## Execution sequence

- **Phase 0 — Core packages**
  - `packages/web-core` — finish + verify already-staged shared-UI work
    (`error-state`, `loading-button`, `show`, expanded `loading`) and the admin
    views already migrated to them.
  - `packages/api-core` — audit `ports/`, `common/`, `config/` for violations.
- **Phase 1 — Golden backend module:** `users` (api-identity) → reference.
- **Phase 2 — Rest of api-identity:** auth, access-control, mfa, organizations,
  preferences, sso.
- **Phase 3 — api-platform:** jobs, files, mail, notifications, settings, audit,
  imports, exports, activities, attachments, storage.
- **Phase 4 — Golden frontend feature:** admin `users` → reference.
- **Phase 5 — Rest of admin features.**
- **Phase 6 — `web` features.**

## Verification

Per unit: narrow lint/typecheck/test. Per phase: `pnpm lint`, `pnpm typecheck`,
`pnpm test`. Contract-affecting backend changes: `pnpm generate` +
`pnpm run generate:check`. Never hand-edit generated clients.

## Non-goals

- No new architecture patterns beyond the canonical rule (amend the rule doc first if needed).
- No unrelated refactoring or dependency upgrades (respect the TS7 dual-toolchain hazard).
- No big-bang rewrite; module-by-module only.
