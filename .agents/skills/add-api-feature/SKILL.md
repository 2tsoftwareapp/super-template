---
name: add-api-feature
description: Scaffold a complete NestJS feature module end-to-end — module/controller/service/DTOs in apps/api, regenerate OpenAPI contract, and stub the TanStack Query hook in apps/web and optionally a data table page in apps/admin.
---

# Add API Feature

Scaffold a new feature across the full monorepo stack.

## Gather Requirements

Ask the user for the following before writing any code:

1. **Feature name** — singular, camelCase (e.g. `notification`, `invoice`, `report`)
2. **HTTP methods** — which of GET (list), GET (single), POST, PATCH, DELETE are needed
3. **Admin UI?** — should a basic data table page be added to `apps/admin`?
4. **Needs DB table?** — does this feature require a new Drizzle schema table?

## Scaffold Steps

### 1. NestJS feature module (`packages/api-<context>/src/modules/<feature>/`)

Create the following layout inside the correct bounded-context package (`api-identity` or `api-platform`):

```
modules/<feature>/
  <feature>.module.ts
  presentation/
    <feature>.controller.ts
    <feature>.dto.ts
  application/
    <feature>.service.ts
    <feature>.mapper.ts          # optional; response shaping
    <feature>.repository.port.ts # optional; repository interface + token
  infrastructure/
    <feature>.repository.ts
```

**`<feature>.module.ts`** — register controller, repository, service, and any port bindings (`{ provide: TOKEN, useExisting: Repository }`).

**`presentation/<feature>.controller.ts`** — HTTP layer only:
- `@ApiTags('<feature>')` on the class
- `@ApiBearerAuth()` on the class
- `@Permissions(PERMISSION_NAMES.*)` from `@repo/api-core`
- Delegate to the application service; do not import infrastructure

**`application/<feature>.service.ts`** — business logic; depend on repositories via port tokens when crossing layers, and on `api-core` ports for other contexts

**`application/<feature>.mapper.ts`** — map repository records to response DTOs (keeps services free of presentation imports over time)

**`presentation/<feature>.dto.ts`** — `class-validator` + `@ApiProperty()` on every field

Do **not** add features under `apps/api/src/<feature>/`. `apps/api` is the composition root only.

### 2. Register Module

Add `<Feature>Module` to the aggregate module in the context package (`IdentityModule` or `PlatformModule`). Those aggregates are already imported in `apps/api/src/app.module.ts`.

### 3. Regenerate Contracts

Run from the project root:
```bash
make generate
```

This regenerates `apps/api/openapi.json` and `packages/api-contract/src/generated/index.ts` and the Dart client.

If the command fails, inspect the error — most likely a missing `@ApiProperty()` or unregistered DTO class.

### 4. TanStack Query Hook (`apps/web/src/features/<feature>/`)

Create `use-<feature>.ts` with typed hooks using the generated `api-contract` types:
- `use<Feature>List` — GET list query
- `use<Feature>` — GET single query (if requested)
- `useCreate<Feature>` — POST mutation (if requested)
- `useUpdate<Feature>` — PATCH mutation (if requested)
- `useDelete<Feature>` — DELETE mutation (if requested)

### 5. Admin Data Table (if requested)

Create `apps/admin/src/pages/<feature>/<Feature>Page.tsx` with a basic TanStack Table connected to the list query hook.

### 6. DB Schema (if requested)

Create `packages/api-database/src/schema/<feature>.ts` with the Drizzle table definition, then run:
```bash
make db-generate
```

Remind the user to review the generated migration with the `drizzle-migration-reviewer` agent before running `make db-migrate`.

## Output

After scaffolding, print a checklist of all created/modified files and next steps:
- [ ] Write unit tests for `<Feature>Service`
- [ ] Implement real DB queries in the service
- [ ] Add E2E tests in `apps/web/tests/`
- [ ] Review migration with drizzle-migration-reviewer (if DB table added)
