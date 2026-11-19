# Conventions

The concrete shape of this codebase. Short on purpose: if a rule here cannot be
checked by `pnpm run check`, a reviewer, or a grep, it does not belong here.

Why these rules exist, with the measured baseline and the six failures they
prevent: [`docs/CLEAN_CODE.md`](CLEAN_CODE.md).

`ARCHITECTURE_RULES.md` and `CODING_RULES.md` remain as reference material. When
they disagree with this file, this file wins.

---

## 1. A feature package

One package per **bounded context that owns data**: it has its own tables, its own
HTTP surface, and its own tests. Everything else is a folder, not a package.

```
packages/feature-users/
  package.json          # exports: ".", "./contracts", "./schema", "./module" (no "./*")
  turbo.json            # {"extends":["//"],"tags":["layer:feature"]}
  src/
    users.feature.ts    # FeatureManifest: id, nestModule, schema, httpPipeline
    users.module.ts     # Nest wiring only
    users.controller.ts # HTTP + DTO validation; no business rules
    users.service.ts    # the behaviour; one method per operation
    users.repository.ts # Drizzle queries for this context
    users.dto.ts        # request/response shapes
    users.mapper.ts     # row → DTO, only when the shapes differ
    domain/             # pure rules worth unit-testing on their own
    __tests__/          # *.spec.ts next to what they test
```

**Layers are optional.** A file earns its layer by containing something the other
layers must not contain:

| Layer | Put it here only if | Do not create it for |
| --- | --- | --- |
| `domain/` | pure rules with edge cases worth testing (policy, invariants) | DTOs, mappers, simple getters |
| `*.service.ts` | orchestration of ≥2 collaborators, a transaction, or branching rules | forwarding a repository call |
| `*.repository.ts` | every SQL query for this context | one query used once by one service |
| `*.mapper.ts` | field renaming / shaping that is easy to get wrong | an identity mapping |

A three-line method that calls `repository.findX()` and returns it belongs on the
controller's service call path, not in its own class file.

## 2. When an interface is allowed

This is the rule that caused the most damage: 53 port files, almost all with a
single implementation.

Create a `*.port.ts` only when **at least one** is true:

1. There are two real implementations today (e.g. S3 vs local storage).
2. It crosses a process/host boundary (worker, mailer, Redis, external API).
3. Two features must not import each other but must collaborate.

Otherwise inject the class. Nest injects classes without a token; the token, the
interface and the `useExisting` provider are pure overhead when nothing swaps them.

Corollary: a repository is a class, not an interface. Its *queries* are the
abstraction that matters, and they are already typed.

## 3. Use-cases

Keep a use-case class when it does one of these:

- runs a transaction over several writes,
- coordinates ≥2 collaborators (repository + outbox + audit),
- enforces a rule that deserves its own test name.

A use-case whose body is `return this.repo.find(id)` is a method call with extra
files. Put it on the feature service.

## 4. Shared code

Before writing a helper, check these. If the helper is missing, add it **there**,
not in the feature.

| Concern | Home |
| --- | --- |
| Pure helpers, errors, types, redaction | `@repo/api-kernel` |
| Pagination DTO + page meta | `@repo/api-runtime/pagination` |
| Sorting params ↔ SQL | `@repo/api-sort` |
| Contract types, BFF path mapping | `@repo/api-contract` |
| Browser storage, errors, formatting | `@repo/web-utils` |
| UI primitives | `@repo/web-ui` (subpath imports only) |

Duplication that already exists and must be migrated: `Math.ceil(total / limit)`
is written out in ~27 files instead of using the shared page-meta helper.

## 5. Naming

| Kind | Convention | Example |
| --- | --- | --- |
| Package | `@repo/<area>-<kebab>` | `@repo/feature-users` |
| File | kebab-case, suffix = role | `users.service.ts`, `users.dto.ts` |
| Class | PascalCase, suffix = role | `UsersService`, `UsersRepository` |
| Function / variable | camelCase | `findByIdStrong` |
| DB table / column | snake_case, prefix by kind | `m_users`, `r_attachments` |
| Test | `<subject>.spec.ts` in `__tests__/` | `users.service.spec.ts` |

No snake_case in TypeScript package names (`mobile_core` is legacy), no
`feature_identity_mobile`-style names for new code.

## 6. Sizes and shape

- File ≤ 300 lines, function ≤ 50 lines, one exported class per file.
- Guard clauses over nesting; early return over `else`.
- No `any`, no `as unknown as` outside JSON/storage boundaries, no `!`.
- An `eslint-disable` needs the reason on the same line.

## 7. Tests

One layout only:

- Unit / integration: `packages/<pkg>/src/**/__tests__/<subject>.spec.ts`
- HTTP end-to-end: `apps/api/test/<area>.e2e.spec.ts`

A test that re-implements the logic it claims to test is a defect: import the
real function. A suite with no assertion is not a test.

## 8. Errors

- Throw `AppError(code, message, status)` with a code from the owning catalog.
- The global filter maps it to the response envelope; features never build
  error JSON by hand.
- Fallbacks must be explicit and narrow: catch a typed error, not everything.
  A bare `catch {}` is reviewed as a bug.

## 9. Definition of done

`pnpm run check` and `pnpm run format:check` green, plus the narrowest test that
would fail if the change were wrong. Nothing is "done" because a build compiled.
