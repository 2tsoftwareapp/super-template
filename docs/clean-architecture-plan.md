# Clean Architecture Plan — Core (API)

> Goal: keep the API maintainable as it grows, so a maintainer/manager can reason about any feature **without reading the whole codebase**. One feature = one predictable folder shape, one direction of dependencies, one way to talk across contexts.
>
> This is prescriptive. The repo already has the right bones (layered modules, ports, `turbo boundaries`, cycle scripts). This plan locks the conventions and lists the concrete refactors to get fully consistent.

---

## 1. Principles (non-negotiable)

1. **The Dependency Rule** — source code dependencies point **inward only**: `presentation → application → domain`, and `infrastructure → domain`. Inner layers never import outer layers, and never import a framework/DB/HTTP type.
2. **Contexts talk through ports, never internals** — a bounded context (package) may only import another context's **public contract** (a port/interface + token), never its `application/` or `infrastructure/` files.
3. **One feature, one shape** — every feature module looks identical (§3). Predictability > cleverness.
4. **Boundaries are enforced by tooling, not goodwill** — every rule here has a check in `pnpm lint:policy` (§8). If it isn't enforced, it will rot.
5. **Small units** — a service/use-case does one job. If a file passes ~250 lines or a class has >5 public methods doing unrelated things, split it.

---

## 2. The layered model (maps to this repo)

```
packages/
  api-core/        ← shared kernel: ports (contracts), config, common, errors, types   (depends on nothing app-specific)
  api-database/    ← infrastructure kernel: drizzle schema, tenant context, pool        (depends only on api-core)
  api-identity/    ← bounded context: auth, users, orgs, access-control
  api-platform/    ← bounded context: files, mail, jobs, audit, settings, imports/exports
  api-workspace/   ← bounded context: projects, comments, activities, notifications, invitations
apps/api/          ← composition root: wires modules, global guards/interceptors, bootstrap
```

Inside **every** context package, each feature is a module with four layers:

| Layer | Folder | Holds | May import | MUST NOT import |
|-------|--------|-------|-----------|-----------------|
| **Presentation** | `presentation/` | Controllers, DTOs, request/response mapping, Swagger decorators | application, core (decorators/types) | infrastructure, drizzle, another context |
| **Application** | `application/` | Use-cases/services: orchestration + business rules, transactions | domain, ports (core), repository *interfaces* | `express`/HTTP types, drizzle, DTOs from `presentation/`, another context's internals |
| **Domain** | `domain/` *(new, thin)* | Entities, value objects, policies, pure invariants | nothing (pure TS) | nest, drizzle, core infra |
| **Infrastructure** | `infrastructure/` | Repositories, external clients (FCM, SMTP), drizzle queries | domain, core, api-database | presentation, another context |

> The `domain/` layer is **new** and intentionally thin — see §6. Today business rules live in `application/` services; we extract only the rules that are worth isolating (policies, invariants), not ceremony for its own sake.

### Dependency direction (must always hold)

```
presentation ─▶ application ─▶ domain ◀─ infrastructure
                    │
                    └─▶ ports (api-core)  ◀─ implemented by infrastructure / other contexts
```

---

## 3. Canonical feature module (copy this shape every time)

```
modules/<feature>/
  <feature>.module.ts                 # wiring only: imports, providers, exports, port bindings
  domain/
    <feature>.entity.ts               # optional: invariants, value objects, pure policies
  application/
    <feature>.service.ts              # use-cases (or split into <verb>-<feature>.use-case.ts when big)
    <feature>.mapper.ts               # domain ↔ DTO mapping (NOT inside the service)
    <feature>.repository.port.ts      # interface the service depends on (+ Symbol token)
  infrastructure/
    <feature>.repository.ts           # implements the repository port using drizzle
    <external>.client.ts              # SMTP/FCM/etc. implements a port from api-core or local port
  presentation/
    <feature>.controller.ts
    admin-<feature>.controller.ts     # admin surface separated from end-user surface
    <feature>.dto.ts
```

**Rules for the module file** (`*.module.ts`): it is the *only* place allowed to reference concrete infrastructure classes and bind them to tokens (`{ provide: TOKEN, useExisting: Impl }`). Services receive ports via `@Inject(TOKEN)`, never `new`.

---

## 4. Cross-context communication — the #1 scalability rule

Today contexts reach into each other's internals **only at the composition root** (`apps/api`, `api-bootstrap`). Feature modules inside a context inject `api-core` port tokens; global `*PortsModule` wiring provides the implementations.

Historical anti-pattern (now removed):

```ts
// ❌ do not reintroduce
import { OrganizationsModule } from '@repo/api-identity/modules/organizations/organizations.module';
import { AuditModule }        from '@repo/api-platform/modules/audit/audit.module';
```

This used to couple `api-workspace` directly to other contexts and permitted a package-level cycle in `turbo.json`. The DAG is now strict: `identity → (core, database)` · `platform → (core, database, identity)` · `workspace → (core, database, identity, platform)` with **no cross-context `*.module.ts` imports** inside feature code.

### Target rule

> A context imports another context **only** via a **port defined in `api-core`** (interface + `Symbol`). The provider context binds its service to the token; the consumer injects the token. No deep `modules/.../application` or `modules/.../infrastructure` imports across packages. Ideally, no cross-context `*.module.ts` import either.

The pattern already exists and works — follow it everywhere:

```ts
// api-core/src/ports/audit-writer.port.ts
export interface AuditWriter { log(event: AuditEvent, executor?: unknown): Promise<void>; }
export const AUDIT_WRITER = Symbol('AUDIT_WRITER');

// platform binds it:           { provide: AUDIT_WRITER, useExisting: AuditService }
// any context consumes it:      constructor(@Inject(AUDIT_WRITER) private audit: AuditWriter) {}
```

Already-correct ports to model after: `USER_NOTIFICATION_SENDER`, `AUDIT_WRITER`, `MAIL_TEMPLATE_SENDER`, `USER_LOOKUP`, `ORGANIZATION_LOOKUP`, `PROJECT_LOOKUP`, `ACTIVITY_EMITTER` (workspace-local). Global `IdentityPortsModule`, `PlatformPortsModule`, and `WorkspacePortsModule` register providers once at the composition root.

### Port hygiene

- Ports live in `api-core/src/ports`, are **pure interfaces + a token**, and use concrete types — **no `executor?: unknown`** (that hole defeats the abstraction; type it as a narrow `DatabaseExecutor`-shaped interface owned by core, or drop it from the port and handle transactions inside the provider).
- A port describes *what the consumer needs*, named from the consumer's view (`UserLookup`, not `UsersServiceFacade`).

---

## 5. Public API of each package (`index.ts`)

Today `api-workspace/src/index.ts` exports repositories (`NotificationsRepository`, `NotificationJobsRepository`, …) — that publishes the infrastructure layer and lets anyone bypass the service.

### Rule

`index.ts` exports **only**:
- the top-level `*Module` (and `*PortsModule`) for the composition root to import,
- types/contracts other contexts legitimately need.

**Never export** `*.repository.ts`, drizzle rows, or internal mappers. Cross-context behavior is reached through a port, not an exported repository. (The composition root in `apps/api` is the only consumer of the module exports.)

---

## 6. Where business rules go (domain layer, used sparingly)

Symptoms to fix:
- `auth.service.ts` is ~900 lines doing register, login, refresh, sessions, password reset, email verification, token signing, **and** email sending — a god service. This is the "hard for a manager" pain directly.
- The same user view-object is built inline in both `login()` and `refresh()` (duplication).
- Services return presentation-shaped objects (`toSessionDto`, ISO strings) — mapping in the application layer.

### Rules

1. **Use-cases over god-services.** Split a large service into use-case methods or files: `register.use-case.ts`, `login.use-case.ts`, `refresh-session.use-case.ts`, … sharing a small `SessionTokenService` and `AuthMapper`. Target: each unit fits on one screen and has one reason to change.
2. **Extract policies into `domain/`** when a rule is reused or worth testing in isolation — e.g. `assertCanAssignRoles` / privileged-role gates (`access-control.service.ts`) become a pure `RoleAssignmentPolicy`. Pure, framework-free, unit-tested without a DB.
3. **Mapping lives in `application/<feature>.mapper.ts`**, not in the service body. Services return domain objects or plain results; mappers turn them into DTOs.
4. **Side-effects (email, push) go behind ports** and are invoked by the use-case, not implemented in it. `sendVerificationEmail` etc. belong to a mail port impl, not `AuthService`.

> Don't over-build. Not every module needs a `domain/` folder — add it only when there are real invariants. CRUD-ish modules can stay presentation→application→infrastructure.

---

## 7. Naming & consistency conventions

- Files: `kebab-case.role.ts` — `.service.ts`, `.repository.ts`, `.controller.ts`, `.dto.ts`, `.port.ts`, `.use-case.ts`, `.mapper.ts`, `.policy.ts`, `.entity.ts`.
- Tokens: `SCREAMING_SNAKE` `Symbol('NAME')`, colocated with the port interface.
- One controller surface per audience: `*.controller.ts` (end user) vs `admin-*.controller.ts` (privileged) — already the pattern, keep it.
- DTOs are the **only** types crossing the HTTP boundary; never return a drizzle row from a controller.
- Errors: throw `AppError(ERROR_CODES.*, msg, HttpStatus.*)` — never raw `Error` in application/presentation (raw `Error` only as a last-resort invariant guard).

---

## 8. Enforcement (extend what already exists)

The repo already runs `pnpm lint:policy` = `check-source-policy.sh` + `check-package-cycles.sh` + `turbo boundaries`. Extend it so every rule above is mechanically checked:

| Rule | Enforcement |
|------|-------------|
| No `any`, no `@boundaries-ignore` | already in `check-source-policy.sh` |
| No cross-context `application/`/`infrastructure/` imports | already in `check-package-cycles.sh` — **extend** to also forbid cross-context `*.module.ts` imports once ports replace them |
| No context↔context cycle | tighten `turbo.json` tags: remove `workspace`/`platform` from `layer:identity`'s allow-list etc. so the graph is a DAG (core ← database ← contexts ← app) |
| `index.ts` exports no `*.repository` | new grep policy: fail if `index.ts` matches `export .*Repository` |
| Presentation doesn't import drizzle/infrastructure | new grep policy on `presentation/` files |
| Application doesn't import `express`/drizzle/`presentation/*.dto` | new grep policy on `application/` files |
| File-size budget (god-service guard) | optional CI check: warn >250 lines in `application/*.service.ts` |

Add each as a `check_policy`/`record_violation` entry so violations fail CI with a clear message.

---

## 9. "Add a feature" recipe (hand this to any contributor)

1. `pnpm gen` / scaffold (or use the `add-api-feature` skill) to create the module in the right context with the §3 shape.
2. Define the **repository port** in `application/<feature>.repository.port.ts`; write the service against the port.
3. Implement the repository in `infrastructure/` against drizzle; bind it in the module file.
4. If another context needs this feature, add a **port in `api-core`** and bind it — do **not** import this module across packages.
5. Controllers + DTOs in `presentation/`; map via `application/<feature>.mapper.ts`.
6. If the feature touches RLS tables, ensure the request path sets tenant context (interceptor) and any **background path wraps work in `tenantContextService.run(...)`** (see the open notifications gap).
7. `pnpm verify` (generate → lint:policy → typecheck → test → build) is green.

**Definition of Done:** matches §3 shape · no cross-context internal import · `index.ts` clean · mapping out of the service · errors via `AppError` · `lint:policy` green · unit tests on any `domain/` policy + e2e on the use-case.

---

## 10. Refactor roadmap (phased, low-risk → high-value)

> Do these as small PRs; each is independently shippable and keeps `pnpm verify` green.

**Phase 1 — Stop the leaks (mechanical, safe)** ✅
- [x] Remove repository/infra exports from every package `index.ts`; fix the (few) composition-root usages.
- [x] Add the `index.ts`-no-repository and presentation/application import policies to `check-source-policy.sh`.

**Phase 2 — Break the context cycle (the big maintainability win)** ✅
- [x] Inventory every cross-context import (`grep "from '@repo/api-\(identity\|platform\|workspace\)/modules"`).
- [x] For each, introduce/relocate a port in `api-core` (e.g. `OrganizationLookup`, `UserLookup`, `ProjectLookup`) and bind it in the provider context.
- [x] Replace deep module imports with token injection + global `*PortsModule`.
- [x] Tighten `turbo.json` tags to a strict DAG; extend cycle script to forbid cross-context `*.module.ts` imports.

**Phase 3 — Decompose god-services** ✅
- [x] Split `auth.service.ts` into use-cases + `SessionTokenService` + `AuthMapper`; dedupe the user view-object.
- [x] Extract `RoleAssignmentPolicy` / privileged-role gates from `access-control.service.ts` into `domain/`, unit-test them.
- [x] Move side-effects (verification/reset/welcome emails) fully behind the mail port (`AuthMailService` → `MAIL_TEMPLATE_SENDER`).

**Phase 4 — Mapping & domain consistency** ✅ (ongoing hygiene)
- [x] Move `toXDto` for auth, projects, notifications, audit into `application/*.mapper.ts`.
- [x] Pilot `PROJECTS_REPOSITORY` port on projects.
- [x] Add the file-size budget warning; address the worst offenders incrementally.

**Follow-ups (not blocking)**
- [ ] Shrink remaining >250-line services (`users`, `notifications`, `projects`, …).
- [ ] Introduce internal input types so application layer can stop importing `presentation/*.dto` (policy is warn-only today).
- [ ] Repository ports on notifications/auth when those features next change.

---

## 11. One-page summary (pin this)

- **Dependencies point inward. Contexts talk only through `api-core` ports.**
- **Every module looks the same** (presentation / application / domain / infrastructure).
- **`index.ts` exposes modules + contracts, never repositories.**
- **Services orchestrate; policies are pure; mapping is separate; side-effects are ports.**
- **If a rule matters, it's in `pnpm lint:policy`.**
