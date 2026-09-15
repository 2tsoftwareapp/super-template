# Super Template — Canonical Architecture Rules

Status: **Canonical**
Audience: humans, Codex, Claude Code, and other AI agents
Applies to: backend, admin, web, mobile-adjacent API contracts, tests, and shared packages

---

## 1. Purpose

This document is the single source of truth for code architecture and coding conventions in `super-template`.

The repository must remain readable and predictable even when multiple AI agents and developers contribute code.

The goal is not to maximize the number of layers. The goal is to make every responsibility have one obvious home.

Core principles:

1. **One dependency direction.**
2. **One canonical folder structure.**
3. **Business logic is independent from transport and rendering.**
4. **Infrastructure implements application contracts.**
5. **Frontend UI receives data and actions; it does not own application workflows.**
6. **No layer exists only to forward calls.**
7. **Rules are enforced by tooling, generators, tests, and review.**
8. **The full template is implemented and manually validated before optional-module extraction.**

When another document, skill, historical spec, or existing legacy feature conflicts with this document, this document wins.

---

# Part I — Repository architecture

## 2. Top-level responsibilities

```text
apps/
  api/        NestJS composition root and runtime
  admin/      primary product/admin Next.js application
  web/        public web/landing Next.js application
  mobile/     Flutter application

apps/api/src/
  composition/    runtime composition and feature registry
  openapi/        OpenAPI / Swagger configuration
  cli/            migrate / seed / reset entry points (+ seeds/)
  shell/          process bootstrap wiring (`bootstrap.ts`)

packages/          kernel libraries + compile-time feature packages
  api-kernel/         framework-free ports, errors, types, pure helpers
  api-plugin-kit/     FeatureManifest + compose helpers
  api-runtime/        Nest HTTP runtime (env schema, guards, filters, Redis)
  database-runtime/   Drizzle pool, RLS/GUC, transactions (composed schema)
  feature-health/     health-check capability — the exemplar feature package
  feature-*/          compile-time feature plugin packages (feature-auth, feature-mail, ...)
  api-contract/       generated TypeScript API contract
  api-sort/           shared sorting contract/helpers
  env-loader/         environment resolution
  config/             cross-runtime non-API config, single source of truth
  utils/              runtime-agnostic pure-TS shared by backend AND web
  observability/      Sentry / error reporting
  web-ui/             shared frontend UI components (no hooks, no logic)
  web-hooks/          shared frontend React hooks
  web-utils/          web-only non-hook logic (http, session, storage, cn)
  web-server/         server-only web logic (auth, cookies, BFF backend)
  web-test/           shared frontend test utilities
```

### 2.1 Shared-package layering

Package placement is governed by **which runtimes** may import the code:

| Package            | May import                        | Never contains                                                 |
| ------------------ | --------------------------------- | -------------------------------------------------------------- |
| `@repo/utils`      | backend + web + app-via-codegen   | `react`, `next`, `@nestjs/*`, DOM or Node-only APIs            |
| `@repo/config`     | backend + web + app-via-JSON/Dart | framework code; API-shaped config (that is the contract's job) |
| `@repo/web-ui`     | web only                          | hooks, data-fetching, business logic                           |
| `@repo/web-hooks`  | web only                          | non-hook logic, UI markup                                      |
| `@repo/web-utils`  | web only                          | React components, React hooks                                  |
| `@repo/web-server` | web server only                   | client-only (`"use client"`) code                              |

Rules:

- **`@repo/utils` must stay runtime-agnostic.** It is the only package importable by
  both the NestJS API and the Next.js BFFs. It must not import any framework, DOM,
  or Node-only API. Duplicated pure-TS logic (e.g. the JSON value model) lives here;
  `@repo/api-runtime` and `@repo/web-utils` re-export from it rather than redefining.
  Node-only crypto (Argon2 password hashing, refresh-token digests) lives in
  `@repo/api-kernel`, not `@repo/utils`.
- **Import from the owning package.** Features should import ports/errors from
  `@repo/api-kernel` and `FeatureManifest` from `@repo/api-plugin-kit`. Prefer those
  over the convenience re-exports on `@repo/api-runtime` (kept for the Nest host).
- **API-shaped config is NOT shared config.** Enums, DTOs, and endpoints are synced
  across runtimes by the generated OpenAPI contract (`@repo/api-contract` → TS + Dart).
  Only non-API constants (pagination defaults, cookie names, feature flags) belong in
  `@repo/config`.
- **`@repo/config` is a generated source of truth.** `src/app-config.ts` is authored in
  TypeScript; `pnpm generate` serializes it to `generated/config.json` and a Dart
  artifact under `apps/mobile/lib/generated/config/`. Do not hand-edit the generated
  files. Backend and web import the TS directly; the app consumes the generated Dart.
- **`@repo/web-ui` primitives.** Prefer consolidating on one headless stack over time
  (Base UI vs Radix). Do not add a third primitive library; new composites should
  reuse the stack already used by neighboring components.

## 3. Composition roots

`apps/api` is a composition root.

It may contain:

- application bootstrap;
- global middleware, filters, pipes, interceptors;
- Swagger/OpenAPI setup;
- runtime composition;
- CLI entry points.

It must not contain feature business logic.

Business features belong in compile-time feature-plugin packages, each package
keeping the standard vertical-slice layering (see §15.1):

```text
packages/feature-<name>/src/...
```

`apps/admin/src/app/**` and `apps/web/src/app/**` are routing composition roots.

They must not become feature implementation folders.

---

# Part II — Backend architecture

## 4. Backend dependency direction

```text
presentation
    ↓
application
    ↓
domain
    ↓
application ports
    ↑
infrastructure implementations
```

The module file binds ports to implementations.

Dependencies must always point inward toward business behavior and contracts.

---

## 5. Canonical backend feature structure

Use this structure as the maximum standard:

```text
packages/feature-<id>/src/
├── <id>.module.ts
│
├── presentation/
│   ├── <feature>.controller.ts
│   ├── dto/
│   │   ├── create-<feature>.dto.ts
│   │   ├── update-<feature>.dto.ts
│   │   ├── list-<feature>-query.dto.ts
│   │   └── <feature>-response.dto.ts
│   └── mappers/
│       └── <feature>-response.mapper.ts
│
├── application/
│   ├── commands/
│   │   └── create-<feature>.command.ts
│   ├── queries/
│   │   └── list-<feature>.query.ts
│   ├── use-cases/
│   │   ├── create-<feature>.use-case.ts
│   │   └── list-<feature>.use-case.ts
│   ├── ports/
│   │   └── <feature>.repository.port.ts
│   ├── models/
│   │   └── <feature>.result.ts
│   └── errors/
│       └── <feature>.errors.ts
│
├── domain/
│   ├── <feature>.entity.ts
│   ├── <feature>.policy.ts
│   ├── <feature>.value-object.ts
│   └── __tests__/
│       └── <feature>.policy.spec.ts
│
└── infrastructure/
    ├── persistence/
    │   ├── drizzle-<feature>.repository.ts
    │   └── <feature>-persistence.mapper.ts
    └── providers/
        └── <provider>-<feature>.adapter.ts
```

Not every feature requires every folder.

Rules:

- do not create empty folders;
- thin CRUD may omit `domain/`;
- complex features may split use cases further;
- do not collapse unrelated responsibilities into `service.ts`;
- do not introduce a different structure for a single feature;
- keep DTOs in `presentation/dto/` — never loose in `presentation/`;
- keep unit tests in `__tests__/` next to the layer they cover
  (`src/**/__tests__/*.spec.ts`). A unit test is never parked beside its subject
  file — the folder boundary is what tells `pnpm --filter <pkg> test` and the
  reviewer which kind of test it is. Integration and composition tests use the
  package or app test boundaries instead (`<pkg>/test/`, `apps/api/test/`).

---

## 6. Presentation layer

Presentation is transport-specific.

It owns:

- controllers;
- route decorators;
- authentication/user extraction;
- path/query/body parsing;
- request validation DTOs;
- response DTOs;
- HTTP status and headers;
- transport mapping.

It does not own:

- business rules;
- transactions;
- persistence;
- provider SDK calls;
- cross-context orchestration;
- reusable domain decisions.

### Controller example

```ts
@Controller("admin/users")
export class AdminUsersController {
  constructor(
    private readonly createUser: CreateUserUseCase,
    private readonly listUsers: ListUsersUseCase,
  ) {}

  @Post()
  async create(
    @CurrentUser() actor: AuthenticatedRequestUser,
    @Body() input: CreateUserDto,
  ): Promise<UserResponseDto> {
    const result = await this.createUser.execute({
      actorId: actor.id,
      email: input.email,
      displayName: input.displayName,
    });

    return UserResponseMapper.toDto(result);
  }
}
```

Controllers inject use cases directly.

---

## 7. Application layer

Application expresses what the system does.

It owns:

- commands and queries;
- use cases;
- transaction boundaries;
- orchestration;
- calls to domain rules;
- repository/provider ports;
- cross-context ports;
- audit coordination;
- side-effect coordination;
- application result types.

### Use-case example

```ts
@Injectable()
export class BlockUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepositoryPort,
    @Inject(SESSION_REVOKER)
    private readonly sessions: SessionRevokerPort,
    @Inject(AUDIT_WRITER)
    private readonly audit: AuditWriterPort,
  ) {}

  async execute(command: BlockUserCommand): Promise<UserResult> {
    const user = await this.users.findById(command.userId);

    if (!user) {
      throw UserErrors.notFound(command.userId);
    }

    assertUserCanBeBlocked({
      actorId: command.actorId,
      target: user,
    });

    return this.users.transaction(async (tx) => {
      const updated = await tx.users.updateStatus(user.id, "BLOCKED");
      await this.sessions.revokeAllForUser(user.id, tx);
      await this.audit.write({
        actorId: command.actorId,
        action: "users.block",
        targetId: user.id,
      });

      return toUserResult(updated);
    });
  }
}
```

### Use-case rules

- one named operation per use-case class;
- primary method is `execute`;
- inputs are commands/queries, not HTTP DTOs;
- outputs are application results, not database rows;
- use cases own atomicity when multiple writes must succeed together;
- orchestration is visible and testable;
- do not hide significant work inside generic helpers.

---

## 8. Pass-through services

Forbidden by default:

```text
Controller
  -> AuthService
    -> LoginUseCase
```

when `AuthService.login()` only calls `LoginUseCase.execute()`.

This adds indirection without behavior.

Allowed facades must be deliberate bounded-context APIs.

A facade is valid only when:

- another bounded context consumes it;
- it exposes a stable minimal contract;
- it hides internal use cases;
- its public role is documented;
- it is not a mandatory controller proxy.

Use names such as:

```text
IdentityFacade
UserLookupPort
OrganizationLookupPort
```

Do not use generic `FeatureService` as a catch-all.

---

## 9. Domain layer

Create `domain/` only when the feature owns a meaningful framework-independent rule.

Examples:

- job retry/cancel lifecycle;
- upload safety policy;
- organization member-role policy;
- pricing or eligibility rules;
- state transitions;
- complex invariants;
- calculations used by multiple use cases.

Thin CRUD modules do not need an empty `domain/`.

Domain code must:

- be framework-free;
- not import NestJS, Express, Drizzle, database schema, Redis, S3, SMTP, Firebase, or controller DTOs;
- have unit tests under `domain/__tests__/`;
- expose named policies, entities, value objects, or pure functions;
- never import application, presentation, or infrastructure.

Application may call domain. Domain never calls application.

---

## 10. Ports

The consumer owns the abstraction.

Repository and provider interfaces live under:

```text
application/ports/
```

Example:

```ts
export const USER_REPOSITORY = Symbol("USER_REPOSITORY");

export interface UserRepositoryPort {
  findById(id: string): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  create(input: CreateUserRecord): Promise<UserRecord>;
  updateStatus(id: string, status: UserStatus): Promise<UserRecord>;
}
```

Infrastructure implements the port:

```ts
@Injectable()
export class DrizzleUserRepository implements UserRepositoryPort {
  // implementation
}
```

Module binding:

```ts
{
  provide: USER_REPOSITORY,
  useClass: DrizzleUserRepository,
}
```

### Port rules

- explicit token;
- explicit interface;
- technical implementation name;
- no concrete provider import in application;
- no database row type exposed outside persistence boundary;
- no interface placed beside the implementation merely for convenience.

---

## 11. Infrastructure layer

Infrastructure owns technical implementation:

- Drizzle/PostgreSQL;
- Redis;
- S3-compatible storage;
- SMTP;
- Firebase;
- external HTTP APIs;
- cryptography provider implementations;
- file system;
- queue drivers.

Infrastructure must not decide:

- whether an actor may perform a business operation;
- whether a lifecycle transition is valid;
- retry policy semantics;
- tenant authorization;
- domain validation rules.

It may enforce technical constraints and translate provider failures into stable application errors.

---

## 12. DTO, command, result, and row separation

Use separate contracts:

```text
Presentation:
  CreateUserDto
  UserResponseDto

Application:
  CreateUserCommand
  UserResult

Infrastructure:
  UserRow
```

Do not:

- pass controller DTOs into use cases;
- return Drizzle rows from use cases;
- expose persistence enums accidentally;
- let response DTOs become domain entities.

Explicit mapping is preferred at boundaries.

### 12.1 Where DTO files live

One layout, everywhere: `*.dto.ts` files sit in a `dto/` folder, and for HTTP
presentation that folder is `presentation/dto/`.

```text
<feature>/src/presentation/dto/users.dto.ts       # controllers import ./dto/users.dto
<feature>/src/exports/presentation/dto/exports.dto.ts
```

Do not:

- park DTOs loose in `presentation/` (`presentation/users.dto.ts`);
- keep a second, compatibility DTO path next to the real one — a re-export barrel
  that nobody imports is a public surface claim, not a compatibility guarantee;
- nest DTOs under a transport folder (`presentation/http/dto/`) when the feature's
  controllers already live in `presentation/`.

DTO class names, fields and validators are contract surface: moving a file may
only change its import specifier, never its shape. No DTO file is re-exported
through a package `exports` subpath, so a move stays inside the package.

---

## 13. Mapping

Use mappers when a boundary changes representation.

Recommended:

```text
UserPersistenceMapper
UserResponseMapper
```

Responsibilities:

```text
database row -> application/domain model
application result -> response DTO
```

Repositories must not construct HTTP DTOs.

Controllers must not understand database fields.

---

## 14. Backend naming

### Classes

```text
CreateUserUseCase
UserRepositoryPort
DrizzleUserRepository
UserResponseMapper
UserPersistenceMapper
IdentityFacade
```

### Files

```text
create-user.use-case.ts
user.repository.port.ts
drizzle-user.repository.ts
user-response.mapper.ts
user-persistence.mapper.ts
```

Avoid ambiguous names:

```text
manager
handler
processor
helper
utils
common
base-service
```

unless the scope is narrow and unmistakable.

---

## 15. Cross-context communication

The identity and platform contexts (`@repo/feature-auth`, `@repo/feature-upload` under `packages/feature-*`) are compile-time feature-plugin packages (see §15.1).

They communicate through:

- deliberate types in `api-kernel`;
- stable port tokens (including `DATABASE_RUNTIME_ENV` for DB pool wiring);
- `TenantContextService` / `getTenantContext` (ALS) in `api-kernel`;
- explicit public facades;
- events when event-driven communication is introduced.

They must not import each other's internal module paths.

Circular module dependencies are architectural warnings.

Before adding `forwardRef()`:

1. identify which context owns the orchestration;
2. consider extracting an application port;
3. consider moving the use case;
4. consider emitting an event;
5. document why the cycle is unavoidable if it remains.

### 15.1 Feature plugin & kernel contract (`packages/*`)

See [ADR 0002](../adr/0002-feature-plugin-architecture.md). `packages/` contains
two kinds of code:

1. **Kernel libraries** (always on) — `api-kernel`, `api-plugin-kit`, `api-runtime`,
   `database-runtime`, `api-contract`, `api-sort`, `env-loader`, `config`, `utils`,
   `observability`, all `web-*` packages, and the Flutter `mobile_core`. The kernel
   holds no identity/platform business tables.
2. **Feature plugins** — optional, self-contained capabilities under
   `packages/feature-<name>/`, wired in explicitly at compile time. `feature-health`
   is the minimal exemplar (backend-only, no schema).

A feature plugin's **backend** surface MUST:

- export exactly one public surface — its Nest `Module` — plus a
  `FeatureManifest` (`@repo/api-plugin-kit`: `{ id, nestModule, schema?, permissions? }`)
  from `index.ts`;
- depend only on kernel packages (`layer:core/env/database/sort/contract`) and
  peer feature **public** surfaces (`layer:feature`) — never on another feature's
  internals, never on any `apps/*` internals;
- keep its full vertical slice inside the package
  (application/infrastructure/presentation/domain as needed);
- own its Drizzle tables under `src/infrastructure/persistence/` (SQL migrations
  are composed into `apps/api/migrations` via `@repo/database-runtime` drizzle-kit);
- carry unit tests under `src/**/__tests__/` and its own lint/typecheck scripts;
- declare a `tsconfig.spec.json` alongside `tsconfig.json` and run **both** from
  `typecheck`, so specs are compiled by the same gate as the code they cover.
  `tsconfig.json` excludes `*.spec.ts` (build output stays test-free), which
  makes the spec program the only thing that type-checks tests. See
  [`packages/tsconfig/README.md`](../../packages/tsconfig/README.md).

> **Schema composition:** `@repo/database-runtime` exports an empty built-in schema.
> Feature packages contribute tables via `FeatureManifest.schema`;
> `apps/api/src/composition/feature-registry.ts` composes them for
> `DatabaseModule.forRoot({ schema })`.

A feature plugin's **frontend** surfaces (admin/web slices, Flutter package) live
in the same package behind per-surface entrypoints (`./admin`, `./web`) and a Dart
sub-package. They use only kernel design-system packages (`@repo/web-*`,
`mobile_core`) — never an app's `@/` aliases.

The app decides whether a feature participates by importing its manifest in one
composition file (`apps/api/src/composition/feature-registry.ts` for backend +
schema, admin resource list for nav, `pubspec.yaml` for mobile) and rendering its
thin route entries.
Removing the workspace dependency + those composition lines removes the capability
on every surface without touching kernel code. Cross-feature communication goes
through kernel ports or a peer's public module — never a deep import.

Removing a feature does not drop its already-migrated tables; that is a separate,
deliberate data migration.

> **Naming across all platforms** (DB table prefixes, feature package ids
> `@repo/feature-<id>`, file/class/route conventions): see
> [Naming Conventions](./NAMING_CONVENTIONS.md).

### 15.2 Error codes and catalogs

`AppError.code` is part of the HTTP contract: clients branch on it, so a value
must have exactly one owner and one meaning. There are three tiers, and nothing
else.

| Tier              | Catalog                                                                           | Use it for                                                                                                                                                                                                                                                       |
| ----------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **transport**     | `ERROR_CODES` in `packages/api-runtime/src/error-codes.ts`                        | cross-cutting HTTP/authorization outcomes any feature may raise: `AUTH_FORBIDDEN`, `AUTH_UNAUTHORIZED`, `INTERNAL_ERROR`, `RATE_LIMITED`, `RESOURCE_CONFLICT`, `SERVICE_UNAVAILABLE`, `VALIDATION_FAILED`. A feature never re-declares these.                    |
| **kernel-shared** | `packages/api-kernel/src/errors/feature-error-codes.ts`                           | domain codes one feature raises **on behalf of another feature's data** (e.g. auth rejecting registration because `feature-settings` disabled it). The owning feature re-exports the same object from its `public/error-codes.ts`, so its contract stays stable. |
| **feature-owned** | `packages/feature-<id>/src/public/error-codes.ts`, exported through `./contracts` | everything specific to the feature's own domain (`JOB_NOT_FOUND`, `MFA_INVALID_CODE`, …).                                                                                                                                                                        |

Rules:

- exactly one catalog declares a given code value — no duplicates across tiers or
  features;
- raise a code through its constant, never a bare string literal. A literal is
  only acceptable for a **shared** tier value (transport or kernel-shared);
- a domain code of another feature is referenced through that feature's
  `./contracts` entrypoint, which means the dependency must already exist. Do not
  add a feature-to-feature dependency just to reuse a constant — promote the code
  to the kernel-shared tier instead (the owning feature then re-exports it);
- never change an existing code value or HTTP status to "clean up" a catalog;
  clients depend on the wire value.

Enforcement: `node scripts/check-error-codes.mjs` (also chained into
`scripts/check-source-policy.sh` and `pnpm run lint:policy`) walks the three
tiers, rejects duplicate owners and rejects disallowed literals. The only
permitted literals are listed with a reason in
`scripts/lib/error-code-policy.mjs`; the guard prints them on every successful
run so the debt stays visible. Its own self-check lives in
`scripts/__tests__/error-code-policy.spec.mjs`.

---

## 16. Transactions

Transactions belong to the application use case that needs atomic behavior.

Use a transaction when consistency requires multiple operations to succeed or fail together.

Examples:

- block user + revoke sessions + audit;
- create organization + owner membership;
- create file metadata + attachment;
- claim job + record attempt.

Repositories may accept a transaction executor, but they do not decide the business transaction boundary.

---

# Part III — Frontend architecture

## 17. Frontend dependency flow

```text
route
  ↓
screen
  ↓
controller hook
  ↓
query/mutation
  ↓
API function
```

The screen also passes controller output into presentational UI.

```text
controller hook
  ↓
presentational UI
```

---

## 18. Canonical frontend feature structure

```text
src/features/<feature>/
├── api/
│   ├── <feature>.api.ts
│   ├── <feature>.query-keys.ts
│   ├── <feature>.queries.ts
│   └── <feature>.mutations.ts
│
├── model/
│   ├── <feature>.types.ts
│   ├── <feature>.schemas.ts
│   ├── <feature>.search-params.ts
│   ├── <feature>.sorting.ts
│   └── <feature>.permissions.ts
│
├── controllers/
│   ├── use-<feature>-list-controller.ts
│   └── use-<feature>-detail-controller.ts
│
├── screens/
│   ├── <feature>-list-screen.tsx
│   └── <feature>-detail-screen.tsx
│
├── ui/
│   ├── <feature>-list-view.tsx
│   ├── <feature>-table.tsx
│   ├── <feature>-toolbar.tsx
│   ├── create-<feature>-drawer.tsx
│   └── delete-<feature>-dialog.tsx
│
└── index.ts
```

Only create folders that have real content.

---

## 19. Route layer

Route entries live in:

```text
src/app/[locale]/**
```

Route files may:

- normalize route params;
- export metadata;
- render a feature screen;
- provide loading/error/Suspense wrappers.

Route files must not:

- call HTTP;
- call React Query;
- define feature forms or schemas;
- manage table/filter state;
- contain feature permission logic;
- contain large feature views.

Example:

```tsx
import { UsersListScreen } from "@/features/users";

export default function UsersPage() {
  return <UsersListScreen />;
}
```

---

## 20. API layer

`api/` owns transport and server-state access.

### API functions

Only `*.api.ts` files and shared HTTP infrastructure may call `webFetch`.

Example:

```ts
export const usersApi = {
  list(params: UsersListParams) {
    return webFetch<ListUsersResponse>(buildUsersListPath(params));
  },

  block(input: BlockUsersInput) {
    return webFetch("/api/admin/users/block", {
      method: "POST",
      body: input,
    });
  },
};
```

### Query hooks

Query hooks own:

- query key;
- query function;
- cache behavior;
- enabled/placeholder/stale settings.

They call API functions.

```ts
export function useUsersListQuery(params: UsersListParams) {
  return useQuery({
    queryKey: usersKeys.list(params),
    queryFn: () => usersApi.list(params),
    placeholderData: keepPreviousData,
  });
}
```

### Mutation hooks

Mutation hooks own:

- mutation function;
- cache invalidation;
- optimistic updates when justified.

Workflow-specific navigation and user messaging usually belong in the controller because the same mutation may be used by multiple screens.

---

## 21. Query keys

Use factories.

```ts
export const usersKeys = {
  all: ["users"] as const,
  lists: () => [...usersKeys.all, "list"] as const,
  list: (params: UsersListParams) =>
    [...usersKeys.lists(), normalizeUsersListParams(params)] as const,
  details: () => [...usersKeys.all, "detail"] as const,
  detail: (id: string) => [...usersKeys.details(), id] as const,
};
```

Do not duplicate literal query keys.

Do not use an unstable object without normalization as part of a query key.

---

## 22. Model layer

`model/` is pure feature logic.

It may contain:

- TypeScript types;
- Zod schemas;
- search-param parsing and serialization;
- sorting/filter rules;
- permission selectors;
- reducers;
- feature formatters;
- framework-free view-model mapping.

It must not import:

- React;
- React Query;
- Next.js router APIs;
- HTTP clients;
- feature UI components.

### Permission selector example

```ts
export function selectUserPermissions(session: AdminSession): UserPermissions {
  const permissions = new Set(session.permissions);

  return {
    canCreate: permissions.has("users.create"),
    canUpdate: permissions.has("users.update"),
    canDelete: permissions.has("users.delete"),
  };
}
```

Views receive booleans, not raw permission arrays.

---

## 23. Controller hooks

Controller hooks are the frontend application/orchestration layer.

They own:

- query and mutation composition;
- URL state;
- local interaction state;
- authenticated session consumption;
- permission derivation;
- event handlers;
- navigation;
- toast coordination;
- dialog workflows;
- mapping server responses to view props.

They must not contain large JSX trees.

Example:

```ts
export function useUsersListController() {
  const urlState = useUsersListUrlState();
  const session = useAdminSession();

  const usersQuery = useUsersListQuery(urlState.queryParams);
  const blockMutation = useBlockUsersMutation();

  const permissions = selectUserPermissions(session);

  const onBlock = async (userIds: string[]) => {
    await blockMutation.mutateAsync({ userIds });
  };

  return {
    viewProps: {
      users: usersQuery.data?.data ?? [],
      total: usersQuery.data?.meta?.total ?? 0,
      isLoading: usersQuery.isLoading,
      error: usersQuery.error,
      search: urlState.search,
      canCreate: permissions.canCreate,
      canUpdate: permissions.canUpdate,
      onSearchChange: urlState.setSearch,
      onBlock,
    },
  };
}
```

When a controller grows too large, split by concern rather than creating a generic helper file.

---

## 24. Screens

A screen is the route-facing feature entry.

It should be small:

```tsx
"use client";

export function UsersListScreen() {
  const controller = useUsersListController();

  return <UsersListView {...controller.viewProps} />;
}
```

A screen may select top-level loading/error variants when that improves clarity.

It must not duplicate controller behavior.

---

## 25. UI layer

UI components render.

They may:

- receive data and callbacks;
- compose shared primitives;
- manage trivial local visual state;
- format already-authorized UI states;
- emit user interactions.

They must not:

- call HTTP;
- call React Query;
- invalidate cache;
- parse URL state;
- read raw session state;
- decide business permissions from strings;
- coordinate multi-step workflows;
- define transport endpoint paths.

Example:

```tsx
type UsersTableProps = {
  users: UserListItem[];
  selectedIds: string[];
  canUpdate: boolean;
  onSelectionChange(ids: string[]): void;
  onActivate(id: string): void;
  onBlock(id: string): void;
};

export function UsersTable(props: UsersTableProps) {
  // render only
}
```

---

## 26. Frontend state ownership

| State                                            | Correct owner                                     |
| ------------------------------------------------ | ------------------------------------------------- |
| server data                                      | TanStack Query                                    |
| page/filter/sort state that should survive/share | URL search params                                 |
| form values                                      | React Hook Form                                   |
| validation                                       | Zod                                               |
| drawer/dialog open state                         | controller or local UI                            |
| authenticated session                            | session provider                                  |
| permissions                                      | pure selector                                     |
| locale/theme                                     | dedicated provider                                |
| cross-page client state                          | store only when other mechanisms are insufficient |

Do not copy server data into local state without a clear reason.

Do not store shareable list state only in component state.

---

## 27. Shared UI

UI primitives come from:

```text
@repo/web-ui/*
```

Shared React hooks come from `@repo/web-hooks/*`. Non-hook web logic (http,
session, storage, `cn`) comes from `@repo/web-utils/*`. Do not put hooks in
`@repo/web-ui` or components in `@repo/web-hooks`.

Do not create local duplicates of:

- button;
- input;
- dialog;
- drawer;
- card;
- alert;
- spinner;
- pagination;
- table primitives;
- toast primitives;
- badge;
- dropdown.

Feature-specific composites stay inside the feature.

---

## 28. Frontend feature boundaries

A feature may import:

- shared packages;
- shared UI;
- generated API contracts;
- another feature's explicit public exports.

A feature must not deep-import another feature's internal files.

Every feature `index.ts` exports only its deliberate public surface.

Avoid catch-all `export *` barrels.

---

## 29. Frontend naming

```text
users.api.ts
users.query-keys.ts
users.queries.ts
users.mutations.ts
users.types.ts
users.schemas.ts
users.search-params.ts
users.permissions.ts
use-users-list-controller.ts
users-list-screen.tsx
users-list-view.tsx
users-table.tsx
```

Avoid ambiguous frontend filenames:

```text
api.ts
data.ts
logic.ts
helpers.ts
utils.ts
manager.ts
```

unless contained in a narrow folder where the responsibility remains explicit.

---

# Part IV — Quality rules

## 30. Readability

Code should optimize for the next maintainer reading the flow.

Prefer:

- explicit names;
- short focused modules;
- visible orchestration;
- pure decision functions;
- typed boundary contracts;
- early returns;
- narrow exports.

Avoid:

- clever abstraction;
- generic service classes;
- hidden side effects;
- deeply nested conditions;
- giant views;
- giant use cases;
- boolean parameter ambiguity;
- duplicate validation or permission logic.

---

## 31. Complexity warning thresholds

| Type                     | Review threshold |
| ------------------------ | ---------------: |
| backend controller       |        150 lines |
| backend use case         |        200 lines |
| React controller hook    |        200 lines |
| React view/component     |        200 lines |
| function                 |         60 lines |
| constructor dependencies |                7 |
| component props          |               15 |

These are review triggers, not automatic failures.

When exceeded, identify distinct responsibilities and split by concern.

Do not split only to satisfy line count.

---

## 32. Error handling

Use stable application errors.

Rules:

- domain/application throws stable typed errors;
- presentation maps errors to HTTP through the global error contract;
- infrastructure translates provider-specific failures;
- frontend API layer preserves the standard error envelope;
- controller hooks convert errors into workflow-specific UI behavior;
- UI renders provided error states.

Do not expose raw provider/database errors to clients.

Do not silently swallow errors unless the behavior is explicitly intentional and tested.

---

## 33. Logging and sensitive data

Never log:

- passwords;
- access tokens;
- refresh tokens;
- cookies;
- MFA secrets;
- recovery codes;
- reset/verification tokens;
- private keys;
- provider credentials.

Use structured logs.

Include correlation/request context where available.

Business audit logs and technical application logs are separate concerns.

---

## 34. Environment configuration

Rules:

- schema-validate environment variables;
- do not read arbitrary `process.env` throughout feature code;
- centralize configuration;
- keep secrets in local/secret-manager files;
- commit examples and safe development defaults only;
- document every variable with owner, requirement, and environment scope.

Optional providers must fail clearly when enabled but misconfigured.

---

# Part V — Testing

## 35. Backend testing

### Domain

- pure unit tests;
- cover valid/invalid transitions;
- cover boundary values;
- no Nest testing module unless necessary.

### Application

- unit tests with mocked/fake ports;
- verify orchestration;
- verify transaction behavior;
- verify side effects;
- verify failure paths.

### Infrastructure

- integration tests for SQL behavior, RLS, locks, concurrency, and provider mapping where risk justifies it.

### Presentation/E2E

- request validation;
- auth and permission behavior;
- response envelope;
- status codes;
- tenant isolation;
- important end-to-end workflows.

Security-critical code requires explicit negative tests.

---

## 36. Frontend testing

### Model

- parsing;
- serialization;
- sorting;
- permission selectors;
- schema validation;
- reducers.

### API

- path building;
- request configuration;
- query-key normalization.

### Controllers

Test non-trivial orchestration:

- query/mutation interaction;
- invalidation;
- URL updates;
- permission branches;
- navigation;
- dialog workflows.

### UI

Test:

- important rendering branches;
- enabled/disabled actions;
- form interaction;
- emitted callbacks;
- loading/error/empty states.

### Workflow

Use browser E2E or manual checks for complete flows.

---

## 37. Manual verification

Automated tests do not replace manual product verification.

Before a feature is considered complete, verify relevant paths:

- happy path;
- validation errors;
- unauthorized/forbidden behavior;
- token expiration;
- retry/concurrency where applicable;
- empty state;
- loading state;
- provider unavailable state;
- mobile/network interruption where applicable;
- production-like configuration.

Record what was manually tested.

---

# Part VI — Generated contracts and database

## 38. OpenAPI contract

NestJS controllers and DTOs are the API source.

After changing controllers, DTOs, or Swagger decorators:

```bash
pnpm generate
pnpm run generate:check
```

Commit generated TypeScript and Dart clients.

Never hand-edit generated clients.

Frontend code should prefer generated contract types over duplicate handwritten transport types.

---

## 39. Database workflow

1. edit canonical Drizzle schema;
2. generate migration;
3. review SQL;
4. verify constraints, indexes, defaults, nullability, RLS, grants, and data migration;
5. run migration;
6. run tests;
7. update documentation if schema behavior changes.

Production migrations use the privileged migration connection.

Runtime uses the restricted application role.

Do not use a superuser/BYPASSRLS runtime connection.

---

# Part VII — Enforcement

## 40. Required automated boundaries

The repository should enforce at least:

### Backend

- `domain/**` cannot import NestJS, Express, Drizzle, or database packages;
- `application/**` cannot import `presentation/**`;
- `application/**` cannot import concrete `infrastructure/**`;
- `presentation/**` cannot import repositories/database packages;
- bounded contexts cannot deep-import each other;
- `apps/api` cannot own feature modules.

### Frontend

- `app/**` cannot import React Query or HTTP clients;
- `ui/**` cannot import React Query, HTTP, router, or session internals;
- `model/**` cannot import React, React Query, router, or HTTP;
- only `*.api.ts` and shared HTTP infrastructure may call `webFetch`;
- features cannot deep-import another feature;
- UI primitives must come from `web-ui`.

Use ESLint, source-policy scripts, Turborepo boundaries, architecture tests, and CI grep guards.

---

## 41. Golden reference features

Maintain:

- one backend reference feature;
- one frontend reference feature.

A reference feature must demonstrate the complete current standard.

New features mirror the reference.

Legacy code is not automatically a reference.

If a reference conflicts with this document, fix the reference.

---

## 42. Scaffolding

Generators should create canonical structure.

Recommended commands:

```bash
pnpm scaffold:api-feature <name>
pnpm scaffold:admin-feature <name>
pnpm scaffold:web-feature <name>
```

Generators create:

- folders;
- named placeholder files;
- test stubs;
- module bindings;
- query-key factory;
- API file;
- controller hook;
- screen;
- public exports.

AI agents should fill business behavior rather than invent file organization.

---

## 43. Instruction hygiene

Canonical architecture must not be duplicated across many files.

Use:

```text
docs/architecture/ARCHITECTURE_RULES.md
```

as the full source.

Other files should summarize and link to it:

- root `AGENTS.md`;
- root `CLAUDE.md`;
- app-specific `AGENTS.md`;
- `.agents/skills/*`;
- `.claude/skills/*`.

Historical specs must be marked historical or archived.

Stale skills must be updated or removed.

---

# Part VIII — Definition of done

## 44. Backend checklist

- correct bounded context;
- correct dependency direction;
- controller is transport-only;
- use case owns orchestration;
- domain rule extracted only when meaningful;
- ports owned by application;
- infrastructure implements ports;
- no pass-through service;
- no DTO/database-row leakage;
- transaction boundary is correct;
- tests added;
- contract regenerated when required.

## 45. Frontend checklist

- route is thin;
- screen is small;
- controller owns orchestration;
- API function owns HTTP;
- query/mutation owns server-state behavior;
- model is pure;
- UI is presentational;
- URL state is stored in URL;
- permissions are centralized;
- shared primitives are reused;
- feature boundary is respected;
- tests and browser/manual verification completed.

## 46. Repository checklist

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm run generate:check
```

Run relevant narrower commands first.

Never report a command as passing unless it was actually executed.

---

# Part IX — Architecture decision procedure

## 47. Where should this code go?

### Backend

Ask in order:

1. Is it HTTP/transport-specific?
   - `presentation/`
2. Is it an application operation or orchestration?
   - `application/use-cases/`
3. Is it a framework-independent business rule?
   - `domain/`
4. Is it an interface required by application?
   - `application/ports/`
5. Is it a technical implementation?
   - `infrastructure/`
6. Is it runtime composition?
   - module file or `apps/api`

### Frontend

Ask in order:

1. Is it route composition?
   - `app/**`
2. Is it HTTP transport?
   - `features/<x>/api/*.api.ts`
3. Is it server-state behavior?
   - queries/mutations
4. Is it pure feature logic or schema?
   - `model/`
5. Is it screen orchestration?
   - `controllers/`
6. Is it the route-facing feature entry?
   - `screens/`
7. Is it rendering?
   - `ui/`
8. Is it reusable across multiple features?
   - shared app component or `web-ui`/`web-hooks`/`web-utils`, depending on ownership

---

## 48. When may a new pattern be introduced?

Only when:

1. the current architecture cannot represent the requirement cleanly;
2. the limitation is demonstrated with concrete code;
3. alternatives were considered;
4. an ADR or update to this document is written first;
5. enforcement and reference implementation are updated;
6. the new pattern applies consistently, not to one isolated file.

AI agents must not introduce a new architectural pattern silently.

---

## 49. Final principle

The project should feel boring in a good way.

A developer or AI agent should be able to predict:

- where code belongs;
- which direction dependencies flow;
- where business rules live;
- where API calls live;
- where UI logic ends;
- how to test the change;
- what must be regenerated;
- what commands prove the change is safe.

Consistency is a product feature of this template.
