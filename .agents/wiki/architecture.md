# Kiến trúc

## Tổng quan (80/20)

- Super Template là monorepo đa tầng với backend NestJS, frontend Next.js, và mobile Flutter.
- Backend tuân theo luồng phụ thuộc một chiều: `Presentation → Application → Domain → App Ports → Infrastructure`.
- Frontend phân tầng dọc: `Route → Screen → Controller Hook → UI View`.
- Dữ liệu multi-tenant cô lập hoàn toàn qua RLS (Row Level Security) PostgreSQL.
- Mọi module nghiệp vụ backend là bounded context riêng (ví dụ: `api-identity`, `api-platform`).

## Backend Architecture

### Layer Dependency

```
Presentation (Controller)
    ↓
Application (Use Case)
    ↓
Domain (Policy, Entity)
    ↓
Application Ports (Repository Port)
    ↓
Infrastructure (Drizzle Repository)
```

| Layer | Trách nhiệm | Quy tắc |
|---|---|---|
| **Presentation** | Xử lý HTTP (route, auth, parse request) | Không gọi Infrastructure trực tiếp |
| **Application** | Orchestration, transaction boundary | Không nhận/truyền Express Request hay HTTP DTO |
| **Domain** | Luật nghiệp vụ, validation | Không phụ thuộc framework/hạ tầng |
| **App Ports** | Interface giao tiếp Database/External | Phục vụ Application |
| **Infrastructure** | Chi tiết Database, S3, Email | Hiện thực hóa App Ports |

### Bounded Contexts

| Context | Package | Trách nhiệm |
|---|---|---|
| Identity & Access | `@repo/api-identity` | Auth, users, organizations, RBAC, SSO, MFA |
| Platform | `@repo/api-platform` | Jobs, files, notifications, audit, mail, imports/exports |
| Health | `@repo/api-health` | Health check endpoint |
| Seed | `@repo/api-seed` | Dev/demo data seeding |

### Multi-tenant

- Tenant isolation qua PostgreSQL RLS (Row Level Security).
- Mỗi request mang `organizationId` để RLS kiểm tra quyền truy cập.
- Global operations (SUPER_ADMIN) bypass RLS qua `bypassRls: true`.

## Frontend Architecture

```
Route (page.tsx)
    ↓
Screen (*-screen.tsx)
    ↓
Controller Hook (use-*)
    ↓
UI View (*-view.tsx, *-table.tsx)
```

| Layer | Trách nhiệm |
|---|---|
| **Route** | URL routing (Next.js App Router) |
| **Screen** | Kết nối Controller và UI View |
| **Controller Hook** | Quản lý state, gọi React Query, mutations |
| **UI View** | Render JSX thuần túy, nhận data/callback từ Screen |

## Mobile Architecture (Flutter)

- State management: Riverpod
- Routing: go_router
- API client: generated Dart từ OpenAPI spec
- Clean architecture: `presentation/ → application/ → domain/ → data/`

## Luồng dữ liệu chính

```
Client → Next.js (BFF) → NestJS API → Drizzle ORM → PostgreSQL
                                                → S3 (files)
                                                → Redis (cache/throttle)
                                                → Firebase (push)
                                                → SMTP (mail)
```

---

Nguồn: `DESIGN.md`, `packages/api-core/`, `packages/api-identity/`, `packages/api-platform/`
Last-synced: `8411838`
