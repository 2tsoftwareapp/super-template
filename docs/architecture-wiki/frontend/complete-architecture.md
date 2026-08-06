---
layout: default
title: Complete frontend architecture
---

# Complete Frontend Architecture

Tài liệu này là bản map đầy đủ của frontend theo repository hiện tại.

## 1. Hai ứng dụng web

| App | Mục đích | Kiểu kiến trúc |
|---|---|---|
| apps/web | Public landing, SEO, public pages | Server-first, page/section oriented |
| apps/admin | Product dashboard, operations, auth | Feature-oriented, interactive |

Không áp dụng cùng một mức độ phức tạp cho hai app.

## 2. apps/web

apps/web phục vụ nội dung public:

- landing page;
- pricing;
- public auth;
- SEO metadata;
- content/blog;
- CTA vào product app.

Nguyên tắc:

- ưu tiên Server Components;
- route/page làm composition;
- data public có thể load ở server;
- chỉ tạo feature module khi có nghiệp vụ hoặc nhiều section;
- không đưa React Query vào mọi page một cách mặc định.

Luồng chuẩn:

Public route → server data function → section component → shared UI.

## 3. apps/admin

apps/admin là product application:

- authentication;
- organization;
- users;
- roles and permissions;
- jobs;
- files;
- imports and exports;
- notifications;
- audit logs;
- settings.

Luồng chuẩn:

Browser → Route → Screen → Controller → Service → Repository → BFF → NestJS API.

## 4. Cấu trúc apps/admin

src/app/
- Next.js route entries;
- layouts and providers;
- metadata;
- loading, error, not-found;
- BFF route handlers under app/api.

src/features/<feature>/
- feature-owned API;
- model and validation;
- controller;
- screen;
- UI composites;
- feature tests.

src/components/
- application shell;
- guards;
- cross-resource components;
- layout-level composites.

src/lib/
- app-specific HTTP/session/navigation utilities;
- no feature business ownership.

src/proxy.ts
- cookie pre-filter;
- locale negotiation;
- request-level protection.

## 5. Feature structure

A normal feature should look like this:

features/users/
- api/users.api.ts
- api/users.query-keys.ts
- api/users.queries.ts
- api/users.mutations.ts
- model/users.types.ts
- model/users.schemas.ts
- model/users.permissions.ts
- model/users.search-params.ts
- controllers/use-users-list-controller.ts
- screens/users-list-screen.tsx
- ui/users-list-view.tsx
- ui/users-table.tsx
- ui/users-toolbar.tsx
- index.ts

Do not create every file for a trivial feature. The structure is a maximum reference, not a requirement to create empty layers.

## 6. Responsibility map

| Component | Owns | Must not own |
|---|---|---|
| Route | URL entry and composition | business logic, HTTP |
| Screen | controller-to-UI connection | raw query orchestration |
| Controller | workflow and state composition | JSX-heavy rendering |
| Service | business rules and orchestration | React lifecycle |
| Repository | API transport and mapping | business decisions |
| Model | types, schemas, pure rules | HTTP and React |
| UI | rendering and events | API, router, permissions |
| Shared package | reusable cross-feature capability | single-feature business logic |

## 7. Service and DI

Service classes are used when a feature has meaningful business behavior or orchestration.

Controller depends on a service interface or service instance. The service receives repository dependencies through its constructor. The repository receives HttpClient through its constructor.

Dependency direction:

Controller → Service → Repository → HttpClient.

The composition root creates concrete implementations. React components never construct infrastructure dependencies.

A service that only forwards one repository method is unnecessary.

## 8. Master and transaction features

Master features:

- users;
- organizations;
- roles;
- permissions;
- settings;
- catalog/reference data.

They normally expose list, detail, create, update and active/inactive operations.

Transaction features:

- jobs;
- imports;
- exports;
- notifications;
- audit records;
- invitations.

They expose commands and lifecycle actions such as start, retry, cancel, complete and archive. Transaction state must not be changed through arbitrary UI field updates.

## 9. State ownership

| State | Owner |
|---|---|
| Server data | TanStack Query |
| Filter, sort, pagination | URL search params |
| Form input | React Hook Form |
| Validation | Zod |
| Dialog and drawer | Controller or local UI |
| Session | Admin session provider |
| Permission | Feature model selector |
| Theme and locale | Providers |
| Cross-page client state | Store only when necessary |

## 10. API and BFF

Feature API functions are the only feature code allowed to call the shared HTTP client.

Query files own cache identity and read behavior. Mutation files own write behavior and cache invalidation. Controllers own navigation, toast and multi-step UI workflow.

BFF routes own:

- HttpOnly cookie handling;
- CSRF;
- access-token attachment;
- refresh flow;
- same-origin browser boundary;
- transport error normalization.

BFF routes do not own business authorization or database access. NestJS remains authoritative.

## 11. Security boundaries

- refresh tokens never enter browser JavaScript;
- no token in localStorage;
- UI permissions are only a presentation hint;
- NestJS re-checks authorization;
- organization context comes from authenticated session;
- API errors are normalized before reaching UI;
- logs never contain secrets or sensitive personal data.

## 12. Shared package map

| Package | Ownership |
|---|---|
| @repo/web-ui | UI primitives |
| @repo/web-hooks | reusable React hooks |
| @repo/web-utils | web-only utility and HTTP code |
| @repo/web-server | server-only auth and BFF helpers |
| @repo/api-contract | generated OpenAPI contract |
| @repo/utils | pure cross-runtime TypeScript |
| @repo/web-test | frontend test helpers |

A package is shared only after at least two independent consumers exist.

## 13. Dependency restrictions

Allowed:

Route → Screen → Controller → Service → Repository → HttpClient.

Forbidden:

- UI → API;
- Model → React;
- Model → Router;
- Route → React Query;
- Repository → UI;
- Service → React;
- feature A → feature B internal file;
- web-ui → business feature;
- web-server → client-only code.

## 14. Definition of done

A frontend feature is complete when:

- code is in the correct feature;
- route is thin;
- state ownership is explicit;
- API contract is generated;
- service/repository boundary is clear;
- permission behavior is centralized;
- loading, empty, error and success states exist;
- unit tests cover model and non-trivial controller behavior;
- important flow has browser verification;
- relevant admin checks pass.
