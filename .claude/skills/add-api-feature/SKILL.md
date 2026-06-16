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

### 1. NestJS Module (`apps/api/src/<feature>/`)

Create the following files:

**`<feature>.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { <Feature>Controller } from './<feature>.controller';
import { <Feature>Service } from './<feature>.service';

@Module({
  controllers: [<Feature>Controller],
  providers: [<Feature>Service],
})
export class <Feature>Module {}
```

**`<feature>.controller.ts`** — include all requested HTTP methods with:
- `@ApiTags('<feature>')` on the class
- `@ApiBearerAuth()` on the class
- `@ApiOperation({ summary: '...' })` on each method
- `@ApiOkResponse` / `@ApiCreatedResponse` with the response DTO

**`<feature>.service.ts`** — stub methods that match the controller, returning typed placeholder data

**`dto/create-<feature>.dto.ts`** and **`dto/update-<feature>.dto.ts`** — use `class-validator` decorators and `@ApiProperty()` on every field

**`dto/<feature>-response.dto.ts`** — response shape with `@ApiProperty()` on every field

### 2. Register Module

Add `<Feature>Module` to the `imports` array in `apps/api/src/app.module.ts`.

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
