# @repo/api-seed

Idempotent development/demo data seeding (formerly misnamed `api-bootstrap`).

- `seeds/<area>/seed.ts` — one seeder per area (users, access-control, settings, notifications), safe to re-run.
- Entry point: `seedDatabase` — invoked by `pnpm --filter api db:seed` and CI.

Add a new seeder by dropping a module under `seeds/` and wiring it in `seed-data.ts`; keep every insert idempotent (upsert or existence-check).
