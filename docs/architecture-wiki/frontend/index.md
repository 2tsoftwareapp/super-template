---
layout: default
title: Web Admin Frontend
---

# Web Admin Frontend

## Kiến trúc tổng quát

```text
Next.js Route
  → Screen
    → Controller Hook
      → Service Class
        → Repository Class
          → HttpClient
            → BFF
              → NestJS API
```

## Các layer

| Layer | Trách nhiệm |
|---|---|
| `app/` | Route, layout, metadata, loading, error |
| `screens/` | Kết nối controller với UI |
| `controllers/` | React Query, local state, URL state, workflow |
| `services/` | Business logic và orchestration |
| `repositories/` | API endpoint và mapping transport |
| `model/` | Type, schema, permission, pure functions |
| `ui/` | Presentational components |
| `common/` | Primitive dùng chung thật sự |

## Luồng dependency

```text
app
 ↓
screens
 ↓
controllers
 ↓
services
 ↓
repositories
 ↓
http-client
```

UI nhận dữ liệu từ controller:

```text
controller → screen → ui
```

## Quy tắc quan trọng

- Không gọi API trực tiếp trong UI.
- Không đặt business logic trong `page.tsx`.
- Service dùng class và constructor injection.
- Repository không quyết định business rule.
- Model không import React, router hoặc HTTP.
- Feature khác chỉ được import qua public `index.ts`.
- Shared UI dùng từ `@repo/web-ui`.

## Master và Transaction

```text
features/
├── master/
│   ├── users/
│   ├── organizations/
│   └── roles/
└── transactions/
    ├── jobs/
    ├── imports/
    └── notifications/
```

- **Master**: dữ liệu nền, CRUD, active/inactive.
- **Transaction**: hành động nghiệp vụ, lifecycle, retry/cancel/complete.

## Tiếp theo

- [Folder structure](./folder-structure.md)
- [Service and DI](./service-di.md)
- [Quality rules](./quality-rules.md)
