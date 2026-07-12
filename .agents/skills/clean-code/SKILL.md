---
name: enforce-project-architecture
description: Enforce the canonical backend and frontend architecture of super-template. Use before creating, modifying, reviewing, or refactoring any feature in apps/api, apps/admin, apps/web, packages/api-identity, packages/api-platform, packages/web-core, or related tests. Prevents AI agents from inventing new folder structures, bypassing layers, mixing business logic with UI, or introducing duplicate patterns.
---

# Enforce Project Architecture

## Purpose

Use this skill for every task that changes application code.

The repository has one canonical architecture source:

- `docs/architecture/ARCHITECTURE_RULES.md`

Read that file before planning or writing code. Do not invent an alternative structure even when another framework pattern is technically valid.

The goal is consistency across humans and AI agents:

- one dependency direction;
- one naming convention;
- one place for each responsibility;
- no business logic hidden in controllers or React views;
- no infrastructure leaking into application or domain code;
- no duplicated UI primitives;
- no new pattern unless the canonical rule is explicitly amended first.

---

## Mandatory workflow

### 1. Classify the change

Identify the change as one or more of:

- backend HTTP/presentation;
- backend application/use case;
- backend domain rule;
- backend infrastructure/provider;
- frontend route;
- frontend API access;
- frontend server state;
- frontend orchestration/controller;
- frontend model/schema/state;
- frontend UI;
- shared platform concern;
- generated contract;
- database schema/migration;
- test-only change.

State the affected layer before editing.

### 2. Locate the existing feature boundary

Backend feature code belongs under the correct bounded context:

```text
packages/api-identity/src/modules/<feature>/
packages/api-platform/src/modules/<feature>/
```

Do not create business features under `apps/api/src`.

Frontend feature code belongs under:

```text
apps/admin/src/features/<feature>/
apps/web/src/features/<feature>/
```

Route entries remain under `src/app/**`.

### 3. Mirror the canonical structure

Use the exact structure and naming rules from:

```text
docs/architecture/ARCHITECTURE_RULES.md
```

Do not rely on old specs, stale migration notes, or historical plans when they conflict with the canonical rule.

### 4. Inspect a reference implementation

Before creating a new pattern, inspect the nearest existing feature that already follows the canonical architecture.

Prefer a reference with similar complexity:

- CRUD/list/detail;
- transactional command;
- background job;
- file upload;
- authentication flow;
- table/filter/pagination screen;
- form/drawer flow.

Do not copy legacy inconsistencies. If the reference conflicts with the canonical rule, follow the canonical rule and record the mismatch in the final report.

### 5. Plan files before coding

List:

- files to create;
- files to modify;
- layer of each file;
- dependency direction;
- tests required;
- generated artifacts affected.

Reject the plan if:

- presentation imports infrastructure;
- application imports presentation DTOs;
- domain imports framework or database code;
- frontend UI calls HTTP or React Query;
- route files contain business logic;
- a new pass-through service is introduced;
- a feature reaches into another feature's internal files.

### 6. Implement vertically

For backend work, complete the vertical path:

```text
presentation
  -> application use case
  -> domain rule when required
  -> application port
  -> infrastructure adapter
  -> module binding
  -> tests
  -> generated contract
```

For frontend work, complete the vertical path:

```text
route
  -> screen
  -> controller hook
  -> query/mutation
  -> API function
  -> model
  -> presentational UI
  -> tests
```

Do not leave business logic in temporary UI/controller locations with a promise to move it later.

### 7. Verify boundaries

Run the narrowest relevant commands first, then the repository checks.

Typical backend verification:

```bash
pnpm --filter api lint
pnpm --filter api typecheck
pnpm --filter api test
```

Typical admin verification:

```bash
pnpm --filter admin lint
pnpm --filter admin typecheck
pnpm --filter admin test
```

Typical web verification:

```bash
pnpm --filter web lint
pnpm --filter web typecheck
pnpm --filter web test
```

Contract-affecting changes:

```bash
pnpm generate
pnpm run generate:check
```

Repository verification:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

For UI changes, perform a browser check of the affected workflow.

---

# Backend enforcement

## Required dependency direction

```text
presentation
    -> application
        -> domain
        -> application ports
            <- infrastructure implementations
```

Allowed:

- presentation imports application;
- application imports domain;
- application imports application ports;
- infrastructure implements application ports;
- module files bind ports to implementations;
- domain may import the shared kernel only when explicitly permitted by the canonical rule.

Forbidden:

- domain imports NestJS, Express, Drizzle, database schema, Redis, S3, SMTP, Firebase, or HTTP DTOs;
- application imports controller DTOs;
- application imports concrete infrastructure implementations;
- presentation imports repositories or database code;
- infrastructure decides business authorization or lifecycle rules;
- one bounded context imports another context's internal module files.

## Controller rules

Controllers may:

- declare routes and decorators;
- parse body, query, params, headers, and authenticated context;
- call use cases;
- map application results to response DTOs;
- choose HTTP response status and transport-specific behavior.

Controllers must not:

- query the database;
- open transactions;
- implement business branches;
- send mail or notifications directly;
- call concrete provider SDKs;
- contain reusable mapping logic;
- return raw database records.

Inject use cases directly.

Do not add a feature service that only forwards calls from controller to use case.

## Application rules

Application code owns:

- commands and queries;
- use-case orchestration;
- transaction boundaries;
- calls to domain policies;
- calls to repository/provider ports;
- cross-context calls through stable ports;
- audit and side-effect coordination;
- application result models.

Use-case naming:

```text
CreateUserUseCase
ListUsersUseCase
BlockUserUseCase
SendNotificationUseCase
```

File naming:

```text
create-user.use-case.ts
list-users.use-case.ts
block-user.use-case.ts
```

Every use case exposes one primary method:

```ts
execute(command)
```

Avoid generic methods such as `handle`, `process`, `runTask`, or `doWork`.

## Pass-through service rule

Do not create:

```text
Controller -> FeatureService -> UseCase
```

when the feature service merely forwards arguments.

A facade is allowed only when it is an intentional public API for another bounded context. Such a facade must:

- expose a small stable contract;
- hide internal use cases;
- have at least one external consumer;
- be named and documented as a bounded-context facade or port;
- not be used as a mandatory controller intermediary.

## Domain rule

Create `domain/` only when the feature owns a meaningful framework-independent rule, including:

- state machine or lifecycle;
- safety or validation policy;
- authorization rule beyond permission lookup;
- calculation or decision logic;
- invariant that must remain consistent across use cases.

Do not create empty domain folders for thin CRUD.

Domain code must:

- be framework-free;
- be deterministic where practical;
- have colocated unit tests;
- expose named policies, value objects, entities, or pure functions;
- never depend on application, presentation, or infrastructure.

## Ports and repositories

Repository/provider interfaces belong in:

```text
application/ports/
```

Use explicit names:

```text
UserRepositoryPort
MailSenderPort
ObjectStoragePort
AuditWriterPort
SessionRevokerPort
```

Token names:

```text
USER_REPOSITORY
MAIL_SENDER
OBJECT_STORAGE
```

Infrastructure implementations use technical names:

```text
DrizzleUserRepository
SmtpMailSender
S3ObjectStorage
FirebasePushSender
```

Do not name an infrastructure implementation only `UserRepository` or `MailService`.

## DTO and model separation

Transport DTOs belong to presentation:

```text
presentation/dto/create-user.dto.ts
presentation/dto/user-response.dto.ts
```

Application contracts belong to application:

```text
application/commands/create-user.command.ts
application/models/user.result.ts
```

Do not pass a controller DTO directly into application code.

Do not return database row types from use cases or controllers.

## Mapping

Use explicit mappers when crossing boundaries:

- persistence row -> application/domain model;
- application result -> response DTO.

Recommended names:

```text
UserPersistenceMapper
UserResponseMapper
```

Do not place response mapping inside repositories.

## Module files

`<feature>.module.ts` is composition only:

- imports;
- controllers;
- providers;
- port bindings;
- deliberate exports.

It must not contain business logic.

Export the minimum public surface.

## Cross-context communication

Bounded contexts communicate only through:

- shared kernel types deliberately placed in `api-core`;
- stable port tokens;
- explicit public facades;
- events when an event mechanism is introduced.

Forbidden:

```text
api-platform/... imports api-identity/src/modules/users/internal-file
```

Do not use `forwardRef()` as the default solution. A circular dependency is an architectural warning. Prefer extracting a port or moving orchestration to the correct owner.

---

# Frontend enforcement

## Required flow

```text
route
  -> screen
    -> controller hook
      -> queries/mutations
        -> API functions
    -> presentational UI
```

## Route rules

Files under `src/app/**` may contain only:

- `page.tsx`;
- `layout.tsx`;
- route metadata;
- route params normalization;
- Suspense/error/loading wrappers;
- a render of the feature screen.

Route files must not:

- call `webFetch`;
- call `useQuery` or `useMutation`;
- define Zod business schemas;
- manage table state;
- implement permission logic;
- contain feature workflows;
- define large UI trees.

## Feature structure

Use:

```text
features/<feature>/
  api/
  model/
  controllers/
  screens/
  ui/
  index.ts
```

Use only folders that contain real code. Do not add empty folders.

### `api/`

Contains:

- API functions;
- endpoint/path builders;
- query key factory;
- React Query query hooks;
- React Query mutation hooks.

Only API functions may call `webFetch` or the shared HTTP client.

Query hooks call API functions. They do not build transport details inline.

### `model/`

Contains pure feature code:

- types;
- Zod schemas;
- URL search-param parsing and serialization;
- sorting/filter normalization;
- permission selectors;
- reducers;
- formatters specific to the feature;
- view-model mapping when framework-free.

`model/` must not import React, React Query, router APIs, or HTTP clients.

### `controllers/`

Contains orchestration hooks:

- compose queries and mutations;
- manage URL state;
- manage local interaction state;
- read session and permissions;
- create event handlers;
- map data to view props;
- coordinate toasts/navigation/dialogs.

Controller hooks must not contain large JSX trees.

Split a controller by concern when it becomes difficult to read:

```text
use-users-list-url-state.ts
use-users-list-selection.ts
use-users-list-actions.ts
use-users-list-controller.ts
```

### `screens/`

A screen is the feature entry used by the route.

It:

- calls the controller;
- handles top-level loading/error boundaries when appropriate;
- passes props to the view;
- contains minimal JSX.

### `ui/`

Contains presentational feature components:

- views;
- forms;
- tables;
- columns;
- drawers;
- dialogs;
- cards;
- feature-specific composites.

UI components receive data and callbacks through props.

UI must not:

- call HTTP;
- call React Query;
- invalidate cache;
- read raw session state;
- parse URL search params;
- hard-code permission string checks;
- coordinate multi-step business workflows.

## Frontend API naming

Prefer:

```text
users.api.ts
users.query-keys.ts
users.queries.ts
users.mutations.ts
```

Do not call frontend HTTP wrappers `service` unless they represent a real domain service independent of transport.

## Query keys

Use a key factory:

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

Do not duplicate literal query keys across files.

## State ownership

Use the correct state mechanism:

| State | Owner |
|---|---|
| backend/server data | TanStack Query |
| shareable page/filter/sort state | URL search params |
| form values | React Hook Form |
| validation | Zod |
| temporary drawer/dialog state | controller or local UI state |
| authenticated session | session provider |
| permissions | pure selectors derived from session |
| theme/locale | dedicated provider |
| cross-page client state | a store only when URL/query/provider is insufficient |

Do not mirror server state into local component state without a documented reason.

## Permissions

Centralize feature permission selectors in `model/`.

Do not repeat:

```ts
permissions.includes("users.update")
```

across views and components.

UI receives booleans such as:

```text
canCreate
canUpdate
canDelete
```

Server authorization remains authoritative.

## Shared UI

Reusable primitives come from:

```text
@repo/web-core/components/*
```

Do not create local copies of buttons, inputs, dialogs, cards, tables, badges, or feedback components.

Feature-specific composites remain inside the feature.

## Feature boundaries

A feature may import:

- shared libraries;
- shared UI;
- generated API contracts;
- another feature's deliberate public exports from its `index.ts`.

A feature must not deep-import another feature's internal files.

Avoid catch-all barrels. Export only the deliberate public surface.

---

# Naming rules

## Backend

```text
<verb>-<entity>.use-case.ts
<entity>.repository.port.ts
drizzle-<entity>.repository.ts
<entity>-response.mapper.ts
<entity>-persistence.mapper.ts
<entity>.controller.ts
<entity>.module.ts
```

## Frontend

```text
<feature>.api.ts
<feature>.query-keys.ts
<feature>.queries.ts
<feature>.mutations.ts
<feature>.types.ts
<feature>.schemas.ts
<feature>.search-params.ts
use-<feature>-controller.ts
<feature>-screen.tsx
<feature>-view.tsx
```

Use names that express responsibility. Avoid:

```text
utils.ts
helpers.ts
common.ts
manager.ts
handler.ts
processor.ts
data.ts
types.ts
```

unless the file scope is already unambiguous and narrow.

---

# Size and complexity warnings

These are warning thresholds, not blind deletion rules:

| File/type | Review threshold |
|---|---:|
| controller | 150 lines |
| use case | 200 lines |
| React controller hook | 200 lines |
| React view/component | 200 lines |
| function | 60 lines |
| constructor dependencies | 7 |
| component props | 15 |

When a threshold is exceeded:

1. identify distinct responsibilities;
2. extract by concern, not arbitrary line count;
3. avoid generic helper dumping grounds;
4. keep orchestration visible.

---

# Testing rules

## Backend

- domain policies: pure unit tests;
- use cases: unit tests with port doubles;
- repositories: integration tests against PostgreSQL where behavior matters;
- controllers/transport: E2E tests for contract and authorization;
- security-sensitive code: explicit success and failure-path tests;
- tenant-aware features: cross-tenant denial tests.

## Frontend

- model/search/sort/permission functions: unit tests;
- API path builders: unit tests;
- controller hooks: tests for orchestration when behavior is non-trivial;
- views: interaction/render tests for important branches;
- full workflows: browser E2E/manual checks.

Tests should live close to the code they verify unless repository-wide E2E infrastructure requires another location.

---

# Contract and generated code

After changing NestJS controllers, DTOs, Swagger decorators, or response contracts:

```bash
pnpm generate
pnpm run generate:check
```

Never hand-edit generated TypeScript or Dart clients.

Treat generated contract drift as a failing change.

---

# Database changes

For a schema change:

1. edit the canonical Drizzle schema;
2. generate the migration;
3. review generated SQL manually;
4. verify indexes, constraints, defaults, nullability, RLS, grants, and rollback implications;
5. run migration and relevant tests;
6. regenerate contracts only when API shapes changed.

Do not use `db:push` as a production migration workflow.

---

# Mandatory self-review

Before finishing, answer:

## Backend

- Did presentation import infrastructure?
- Did application import presentation DTOs?
- Did domain import framework/database code?
- Is any service only forwarding to a use case?
- Are repository interfaces on the application side?
- Are database records leaking outward?
- Is cross-context access through a stable port/facade?
- Is a transaction owned by the use case that requires atomicity?

## Frontend

- Does any route contain business logic?
- Does any UI component call HTTP or React Query?
- Does any query hook call HTTP inline instead of an API function?
- Is orchestration inside a controller hook?
- Is URL state stored in the URL?
- Are permissions centralized?
- Are shared primitives reused?
- Does a feature deep-import another feature?

## Delivery

- Are tests included?
- Are generated contracts updated?
- Are lint, typecheck, tests, and build passing?
- Was the changed workflow manually exercised?
- Did the change introduce a new architecture pattern without updating the canonical rule?

---

# Output format

At the end of the task, report:

```text
Architecture classification:
- ...

Files changed by layer:
- ...

Boundary decisions:
- ...

Verification:
- ...

Manual checks:
- ...

Known mismatches or follow-up refactors:
- ...
```

Never claim a check passed unless it was actually run.
