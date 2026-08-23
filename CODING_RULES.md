# CODING_RULES.md

> **Đối tượng:** Lập trình viên và AI Agent làm việc trong monorepo này.
> **Mục đích:** Định nghĩa rules kiến trúc nhất quán cho FE, BE, DB/External Service.
> **Cách dùng:** Đọc toàn bộ file trước khi bắt đầu bất kỳ coding task nào. Mỗi rule có ví dụ ✅ DO và ❌ DON'T từ codebase thực tế.
> **Cập nhật:** Khi thay đổi kiến trúc, phải cập nhật file này trước khi implementation.

---

## Mục lục (Table of Contents)

1. [Legend / Ký hiệu](#1-legend--ký-hiệu)
2. [Monorepo Structure Overview](#2-monorepo-structure-overview)
3. [FE Layer 1: Route (page.tsx)](#3-fe-layer-1-route-pagetsx)
4. [FE Layer 2: Screen (*-view.tsx)](#4-fe-layer-2-screen--viewtsx)
5. [FE Layer 3: Handler (use\<Feature\>Handlers)](#5-fe-layer-3-handler-usefeaturehandlers)
6. [FE Layer 4: API Layer (features/*/api/)](#6-fe-layer-4-api-layer-featuresapi)
7. [FE Layer 5: Model (features/*/model/)](#7-fe-layer-5-model-featuresmodel)
8. [FE Layer 6: UI Components (features/*/ui/)](#8-fe-layer-6-ui-components-featuresui)
9. [FE Shared Directories](#9-fe-shared-directories)
10. [FE Dependency Matrix](#10-fe-dependency-matrix)
11. [BE Clean Architecture Rules](#11-be-clean-architecture-rules)
12. [DB & External Service Rules](#12-db--external-service-rules)
13. [ESLint Enforcement](#13-eslint-enforcement)
14. [Naming Quick Reference](#14-naming-quick-reference)
15. [FE Validation Rules](#15-fe-validation-rules)
16. [FE Shared Hook Composition Rules](#16-fe-shared-hook-composition-rules)
17. [FE Handler Splitting & Flow Comments](#17-fe-handler-splitting--flow-comments)
18. [FE Error Handling Strategy](#18-fe-error-handling-strategy)
19. [FE Cache Rules](#19-fe-cache-rules)
20. [FE Security Rules](#20-fe-security-rules)
21. [FE Performance Rules](#21-fe-performance-rules)
22. [API Contract & Client Generation](#22-api-contract--client-generation)

---

## 1. Legend / Ký hiệu

| Ký hiệu | Ý nghĩa |
|---------|---------|
| ✅ **DO** | Cách viết đúng — nên làm |
| ❌ **DON'T** | Anti-pattern — không được làm |
| ⚠️ **NOTE** | Lưu ý quan trọng, exception, hoặc backward compat |
| 🔒 **SECURITY** | Boundary bảo mật — vi phạm là lỗi nghiêm trọng |
| `→` | "được phép gọi / import" |
| `✗→` | "không được phép gọi / import" |

---

## 2. Monorepo Structure Overview

```
/
├── apps/
│   ├── web/          # Next.js — public-facing web app
│   ├── admin/        # Next.js — admin dashboard
│   ├── api/          # NestJS — backend API server
│   └── mobile/       # Flutter — mobile app (outside scope of these rules)
├── packages/
│   ├── web-ui/       # Shared React UI component library (design system)
│   ├── web-hooks/    # Shared React hooks
│   ├── api-contract/ # Shared API types/DTOs (generated)
│   ├── api-core/     # Shared NestJS base infrastructure
│   ├── (apps/api) identity/  # Bounded Context: auth, users, organizations
│   ├── (apps/api) platform/  # Bounded Context: files, notifications, audit, exports
│   └── eslint-config/ # Shared ESLint config
└── CODING_RULES.md   # ← file này
```

---

## 3. FE Layer 1: Route (page.tsx)

### Trách nhiệm

Là điểm vào của Next.js App Router. Chỉ chịu trách nhiệm routing và truyền tham số URL xuống Screen.

### File path pattern

```
apps/admin/src/app/[locale]/(app)/<route-name>/page.tsx
apps/web/src/app/[locale]/<route-name>/page.tsx
```

### Rules

| # | Rule |
|---|------|
| R1 | Chỉ import và render **một** Screen component |
| R2 | Được phép đọc `params`, `searchParams` từ Next.js props và truyền xuống Screen |
| R3 | **Không** chứa `useState`, `useEffect`, hay bất kỳ React hook nào |
| R4 | **Không** gọi API trực tiếp hoặc import từ `features/*/api/` |
| R5 | **Không** chứa JSX logic phức tạp (conditional rendering, loops) |
| R6 | **Không** import từ `features/*/controllers/` hay `features/*/model/` |

### Naming convention

- File: `page.tsx` (Next.js convention — không đổi tên)
- Component: Không cần export named component — `default export` là chuẩn Next.js

### ✅ DO

```tsx
// apps/admin/src/app/[locale]/(app)/users/page.tsx
import { UsersView } from "@/features/users/screens/users-view";

// Route chỉ render Screen — không có logic nào ở đây
export default function UsersPage() {
  return <UsersView />;
}
```

```tsx
// apps/admin/src/app/[locale]/(app)/users/[id]/page.tsx
import { UserDetailView } from "@/features/users/screens/user-detail-view";

// Truyền params xuống Screen — Screen sẽ dùng chúng
export default function UserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <UserDetailView userId={params.id} />;
}
```

### ❌ DON'T

```tsx
// WRONG: Route tự gọi API và quản lý state
import { useState, useEffect } from "react";
import { usersApi } from "@/features/users/api/users.api"; // ← vi phạm R4

export default function UsersPage() {
  const [users, setUsers] = useState([]); // ← vi phạm R3

  useEffect(() => {
    usersApi.list({}).then(setUsers); // ← vi phạm R3, R4
  }, []);

  return <div>{users.map(u => <div>{u.name}</div>)}</div>; // ← vi phạm R5
}
```

---

## 4. FE Layer 2: Screen (*-view.tsx)

### Trách nhiệm

Kết nối Handler với UI components. Là "trạm trung gian" — không chứa business logic, chỉ wire data và callbacks.

### File path pattern

```
apps/admin/src/features/<feature-name>/screens/<feature>-view.tsx
```

### Rules

| # | Rule |
|---|------|
| R1 | Import Handler hook (`use<Feature>Handlers`) và gọi nó để lấy state + callbacks |
| R2 | Import và render UI components, truyền data/callbacks dưới dạng props |
| R3 | Xử lý **top-level loading/error boundaries** (spinner, error state) |
| R4 | **Không** gọi `useQuery`, `useMutation` trực tiếp |
| R5 | **Không** chứa business logic hay data transformation phức tạp |
| R6 | **Không** import từ `features/*/api/` hoặc `features/*/model/` trực tiếp |
| R7 | Được phép có layout JSX đơn giản (wrapper div, grid) nhưng không phải UI business |

### Naming convention

- File: `<feature>-view.tsx` (kebab-case)
- Component: `<Feature>View` (PascalCase)
- Ví dụ: `users-view.tsx` → `UsersView`, `audit-logs-view.tsx` → `AuditLogsView`

### ✅ DO

```tsx
// apps/admin/src/features/users/screens/users-view.tsx
"use client";

import { ErrorState } from "@repo/web-ui/error-state";
import { Spinner } from "@repo/web-ui/spinner";
import { useUsersListController } from "@/features/users/controllers/use-users-list-controller";
import { UsersListView } from "../ui/users-list-view";

/**
 * Users list screen: connects the users list controller to the presentational
 * view and handles the top-level session loading/error boundaries.
 */
export function UsersView() {
  // Screen chỉ gọi handler và spread kết quả xuống UI
  const controller = useUsersListController();

  if (controller.session.isLoading) {
    return <div className="flex min-h-64 items-center justify-center"><Spinner className="size-5" /></div>;
  }

  if (controller.session.isError) {
    return <ErrorState title="Session error" description="Could not load your session." />;
  }

  return <UsersListView {...controller} />;
}
```

### ❌ DON'T

```tsx
// WRONG: Screen tự quản lý query, mutation, và business logic
import { useMutation, useQuery } from "@tanstack/react-query"; // ← vi phạm R4
import { usersApi } from "@/features/users/api/users.api";    // ← vi phạm R6

export function UsersView() {
  // Screen không được làm điều này — đây là việc của Handler
  const { data } = useQuery({ queryKey: ["users"], queryFn: usersApi.list }); // ← vi phạm R4
  const { mutate } = useMutation({ mutationFn: usersApi.create });            // ← vi phạm R4

  // Logic phức tạp không thuộc Screen
  const filtered = data?.items.filter(u => u.status === "ACTIVE"); // ← vi phạm R5

  return <UsersList users={filtered} onAction={mutate} />;
}
```

---

## 5. FE Layer 3: Handler (use\<Feature\>Handlers)

### Trách nhiệm

Toàn bộ logic FE của một feature: state management, React Query calls, mutations, side effects, callbacks trả về cho Screen.

### File path pattern

```
apps/admin/src/features/<feature-name>/controllers/use<Feature>Handlers.ts
```

⚠️ **NOTE — Backward compat:** Code hiện tại dùng tên `use-*-controller.ts` (VD: `use-users-list-controller.ts`). Convention **mới** là `use<Feature>Handlers.ts` (VD: `useUsersHandlers.ts`). Áp dụng tên mới cho **code tạo mới**; không bắt buộc rename code cũ.

### Rules

| # | Rule |
|---|------|
| R1 | **Không** render JSX — file là `.ts`, không phải `.tsx` |
| R2 | Return một object chứa state data và handler functions |
| R3 | Import từ `features/*/api/` (queries, mutations) và `features/*/model/` (types, schemas) |
| R4 | **Không** import UI components từ `features/*/ui/` hay `@repo/web-ui` |
| R5 | Một handler file = scope của một Screen (không share handler giữa nhiều Screen) |
| R6 | Handler functions đặt tên `handle<Action>` (VD: `handleCreate`, `handleDelete`, `handleSearch`) |
| R7 | **Không** gọi API fetch trực tiếp — chỉ dùng React Query hooks từ `api/` layer |

### Naming convention

| Item | Pattern | Ví dụ |
|------|---------|-------|
| File | `use<Feature>Handlers.ts` | `useUsersHandlers.ts` |
| Hook export | `use<Feature>Handlers` | `useUsersHandlers` |
| Handler function | `handle<Action>` | `handleCreate`, `handleBulkDelete` |
| ViewModel type | `<Feature>ViewModel` | `UsersViewModel` |

### ✅ DO

```tsx
// apps/admin/src/features/users/controllers/useUsersHandlers.ts
"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { useUsersListQuery } from "@/features/users/api/users.queries";
import { useCreateUser } from "@/features/users/api/users.mutations";
import { selectUserManagementPermissions } from "@/features/users/model/users.permissions";
import { parseUsersListSearchParams } from "@/features/users/model/users.search-params";
import { useSession } from "@/hooks/use-session";

export interface UsersViewModel {
  users: { items: User[]; total: number } | undefined;
  isLoading: boolean;
  permissions: { canCreate: boolean; canUpdate: boolean };
  handleCreate: (data: CreateUserForm) => Promise<void>;
  handleSearch: (query: string) => void;
}

// Handler chứa toàn bộ logic — Screen chỉ nhận ViewModel
export function useUsersHandlers(): UsersViewModel {
  const { session } = useSession();
  const searchParams = useSearchParams();
  const params = parseUsersListSearchParams(searchParams);
  const query = useUsersListQuery(params);
  const createMutation = useCreateUser();
  const permissions = selectUserManagementPermissions(session?.permissions);

  const handleCreate = useCallback(async (data: CreateUserForm) => {
    await createMutation.mutateAsync(data);
  }, [createMutation]);

  return {
    users: query.data,
    isLoading: query.isLoading,
    permissions,
    handleCreate,
    handleSearch: useCallback((q) => { /* update search params */ }, []),
  };
}
```

### ❌ DON'T

```tsx
// WRONG 1: Handler render JSX
export function useUsersHandlers() {
  return <div>Users</div>; // ← vi phạm R1 — handler không render JSX
}

// WRONG 2: Handler import UI component
import { UsersTable } from "@/features/users/ui/users-table"; // ← vi phạm R4

// WRONG 3: Handler gọi fetch trực tiếp thay vì React Query
export function useUsersHandlers() {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    fetch("/api/users").then(r => r.json()).then(setUsers); // ← vi phạm R7 — dùng query hook thay thế
  }, []);
}
```

---

## 6. FE Layer 4: API Layer (features/*/api/)

### Trách nhiệm

Tất cả giao tiếp với backend: fetch functions thuần, React Query hooks (queries + mutations), query key factory.

### File path pattern

```
apps/admin/src/features/<feature-name>/api/
  ├── <feature>.api.ts         # Fetch functions thuần (không có React hooks)
  ├── <feature>.queries.ts     # useQuery hooks (wraps api.ts)
  ├── <feature>.mutations.ts   # useMutation hooks (wraps api.ts)
  └── <feature>.query-keys.ts  # Query key factory
```

### Rules

| # | Rule |
|---|------|
| R1 | `*.api.ts`: chỉ là fetch functions — không import React hooks |
| R2 | `*.queries.ts`: wrap `*.api.ts` bằng `useQuery` — không chứa business logic |
| R3 | `*.mutations.ts`: wrap `*.api.ts` bằng `useMutation` — không show toast/alert trực tiếp |
| R4 | `*.query-keys.ts`: chỉ là query key factory — không import React |
| R5 | Error handling tại layer này: re-throw hoặc để React Query xử lý — không gọi `toast()` |
| R6 | **Không** import từ `features/*/controllers/` hay `features/*/screens/` |
| R7 | **Không** chứa UI transformation logic phức tạp |
| R8 | Path/endpoint **không** hardcode string tự do — lấy từ OpenAPI qua `bffPath(...)` / types `@repo/api-contract` (xem §22) |

### Naming convention

| File | Export pattern | Ví dụ |
|------|---------------|-------|
| `<feature>.api.ts` | `<feature>Api` object | `usersApi.list()`, `usersApi.get()` |
| `<feature>.queries.ts` | `use<Feature><Action>Query` | `useUsersListQuery`, `useAdminUserQuery` |
| `<feature>.mutations.ts` | `use<Action><Feature>` | `useCreateUser`, `useBlockUsers` |
| `<feature>.query-keys.ts` | `<feature>Keys` | `usersKeys.list(...)`, `usersKeys.detail(id)` |

### ✅ DO

```ts
// apps/admin/src/features/users/api/users.queries.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import type { UsersListParams } from "../model/types";
import { usersApi } from "./users.api";
import { usersKeys } from "./users.query-keys";

// Mỗi query hook là một wrapper nhỏ — không có logic thêm
export function useUsersListQuery(params: UsersListParams) {
  return useQuery({
    queryKey: usersKeys.list(params),
    queryFn: () => usersApi.list(params),
    placeholderData: (previous) => previous,
  });
}
```

```ts
// apps/admin/src/features/users/api/users.api.ts
import { bffPath } from "@repo/api-contract";
import type { AdminUserDto, CreateAdminUserInput, ListResponse } from "@/lib/api-types";
import { buildPath, webFetch } from "@/lib/http";

// Path lấy từ OpenAPI key — không tự nghĩ "/api/bff/admin/users"
export const usersApi = {
  list(params: UsersListParams) {
    return webFetch<ListResponse<AdminUserDto>>(
      buildPath(bffPath("/api/v1/admin/users"), { page: params.page, limit: params.limit }),
    );
  },
  get(id: string) {
    return webFetch<{ data: AdminUserDto }>(
      bffPath("/api/v1/admin/users/{id}", { id }),
    );
  },
  create(data: CreateAdminUserInput) {
    return webFetch<{ data: AdminUserDto }>(bffPath("/api/v1/admin/users"), {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
```

### ❌ DON'T

```ts
// WRONG 1: api.ts import React hooks
import { useState } from "react"; // ← vi phạm R1

// WRONG 2: mutations.ts gọi toast trực tiếp
import { toast } from "sonner"; // ← vi phạm R3

export function useCreateUser() {
  return useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => toast.success("Created!"), // ← vi phạm R3 — toast thuộc về Handler/Screen
  });
}

// WRONG 3: queries.ts chứa business logic
export function useActiveUsersQuery() {
  const query = useUsersListQuery({});
  // Transformation phức tạp không thuộc API layer
  const activeUsers = query.data?.items.filter(u => u.status === "ACTIVE"); // ← vi phạm R7
  return { ...query, data: activeUsers };
}

// WRONG 4: hardcode URL lệch OpenAPI (hoặc path "đoán" không có trong contract)
webFetch("/api/bff/admin/files"); // ← vi phạm R8 / §22 — BE thật là /api/v1/files
```

---

## 7. FE Layer 5: Model (features/*/model/)

### Trách nhiệm

FE domain logic thuần: Zod validation schemas, TypeScript types, permission selectors, constants, pure utility functions liên quan đến feature.

### File path pattern

```
apps/admin/src/features/<feature-name>/model/
  ├── <feature>.types.ts          # TypeScript interfaces/types
  ├── <feature>.schemas.ts        # Zod validation schemas
  ├── <feature>.permissions.ts    # Permission selector functions (pure)
  ├── <feature>.constants.ts      # Constants, enums
  └── <feature>.search-params.ts  # URL search param parse/serialize (pure)
```

### Rules

| # | Rule |
|---|------|
| R1 | **Không** import React hay bất kỳ React hooks nào |
| R2 | **Không** gọi API hay `fetch` |
| R3 | **Không** có side effects — chỉ pure functions và type definitions |
| R4 | **Không** import từ `features/*/controllers/`, `features/*/screens/`, `features/*/ui/`, `features/*/api/` |
| R5 | Được phép import từ `@repo/api-contract` (shared types) và `zod` |
| R6 | Permission functions nhận data làm argument, không gọi hooks |

### Naming convention

| File | Export pattern | Ví dụ |
|------|---------------|-------|
| `*.types.ts` | Interface/type | `UserRecord`, `UsersListParams` |
| `*.schemas.ts` | Zod schema factory | `createUserSchema(roleIds)` |
| `*.permissions.ts` | `select<Resource>Permissions` | `selectUserManagementPermissions(perms)` |
| `*.constants.ts` | UPPER_SNAKE_CASE | `USER_STATUS`, `PAGE_SIZES` |

### ✅ DO

```ts
// apps/admin/src/features/users/model/users.permissions.ts

/**
 * User-management permission selector. Centralizes the `users.*` permission
 * string checks so views and components receive booleans instead of repeating
 * `permissions.includes("users.update")` across the feature.
 */
export interface UserManagementPermissions {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

// Pure function — nhận permissions array, trả về booleans
export function selectUserManagementPermissions(
  permissions: readonly string[] | undefined,
): UserManagementPermissions {
  const granted = new Set(permissions ?? []);
  return {
    canCreate: granted.has("users.create"),
    canUpdate: granted.has("users.update"),
    canDelete: granted.has("users.delete"),
  };
}
```

```ts
// apps/admin/src/features/users/model/users.schemas.ts
import { z } from "zod";

// Schema factory — nhận runtime data (available roles) để tạo schema có validation đúng
export function createUserSchema(availableRoleIds: string[]) {
  return z.object({
    displayName: z.string().trim().min(2).max(120),
    email: z.email("Enter a valid email address"),
    password: z.string().min(8),
    roleId: z.string().min(1).refine(
      (val) => availableRoleIds.includes(val),
      { message: "Selected role is not available" }
    ),
  });
}
```

### ❌ DON'T

```ts
// WRONG 1: model import React hooks
import { useState } from "react"; // ← vi phạm R1

// WRONG 2: model gọi API
import { usersApi } from "../api/users.api";

export async function fetchAndFilterUsers() {
  const users = await usersApi.list({}); // ← vi phạm R2
  return users.items.filter(u => u.status === "ACTIVE");
}

// WRONG 3: model import từ api/ hay controllers/
import { useUsersListQuery } from "../api/users.queries"; // ← vi phạm R4
```

---

## 8. FE Layer 6: UI Components (features/*/ui/)

### Trách nhiệm

Pure presentational components — chỉ nhận props và callbacks, render JSX. Không quản lý server state hay business logic.

### File path pattern

```
apps/admin/src/features/<feature-name>/ui/
  ├── <feature>-list-view.tsx     # List/table wrapper component
  ├── <feature>-table.tsx         # Table component (columns, rows)
  ├── <feature>-table-columns.tsx # Column definitions
  ├── create-<feature>-drawer.tsx # Create form drawer/modal
  └── <action>-dialog.tsx         # Confirmation dialogs
```

### Rules

| # | Rule |
|---|------|
| R1 | Nhận tất cả data và callbacks qua props — không tự fetch |
| R2 | **Không** gọi `useQuery`, `useMutation`, hay `useSWR` |
| R3 | **Không** import từ `features/*/api/` hay `features/*/controllers/` |
| R4 | `useState` chỉ cho **UI-only state**: open/close dialog, hover, focus — không cho server data |
| R5 | **Không** import từ global state stores (Zustand, Redux) trực tiếp trong UI component |
| R6 | Được phép import từ `@repo/web-ui` (design system) và `features/*/model/` (types only) |
| R7 | Có thể compose các UI components khác trong cùng `ui/` folder |

### Naming convention

| File | Export | Ví dụ |
|------|--------|-------|
| `<feature>-list-view.tsx` | `<Feature>ListView` | `UsersListView` |
| `<feature>-table.tsx` | `<Feature>Table` | `UsersTable` |
| `create-<feature>-drawer.tsx` | `Create<Feature>Drawer` | `CreateUserDrawer` |
| `<action>-dialog.tsx` | `<Action>Dialog` | `ConfirmBlockDialog` |

### ✅ DO

```tsx
// apps/admin/src/features/users/ui/users-list-view.tsx
"use client";

import { DataTable } from "@repo/web-ui/data-table";
import { Button } from "@repo/web-ui/button";
import type { UsersViewModel } from "../controllers/useUsersHandlers";

// Nhận toàn bộ data và callbacks từ Screen (qua spread của ViewModel)
export function UsersListView({
  users,
  isLoading,
  permissions,
  handleCreate,
}: Pick<UsersViewModel, "users" | "isLoading" | "permissions" | "handleCreate">) {
  // Local state chỉ cho UI — open/close create drawer
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div>
      {permissions.canCreate && (
        <Button onClick={() => setIsCreateOpen(true)}>Create User</Button>
      )}
      <DataTable data={users?.items} loading={isLoading} />
      <CreateUserDrawer
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
```

### ❌ DON'T

```tsx
// WRONG 1: UI component tự fetch data
import { useUsersListQuery } from "@/features/users/api/users.queries"; // ← vi phạm R2, R3

export function UsersListView() {
  const { data } = useUsersListQuery({}); // ← vi phạm R2 — đây là việc của Handler
  return <DataTable data={data?.items} />;
}

// WRONG 2: UI component dùng global store
import { useAuthStore } from "@/store/auth"; // ← vi phạm R5

// WRONG 3: UI component chứa business logic
export function UsersListView({ users }: { users: User[] }) {
  // Business logic không thuộc UI layer
  const activeUsers = users.filter(u => {
    return u.status === "ACTIVE" && u.emailVerifiedAt !== null; // ← vi phạm — thuộc model/handler
  });
}
```

---

## 9. FE Shared Directories

### 9.1 `src/hooks/` — Shared Cross-Feature Hooks

**Trách nhiệm:** Hooks được dùng bởi **≥2 features** khác nhau.

**Rules:**
- Không chứa feature-specific logic
- Không import từ bất kỳ `features/*/` nào
- Là pure React hooks — không render JSX
- Ví dụ: `use-session.ts`, `use-bulk-mutation.ts`

```ts
// apps/admin/src/hooks/use-session.ts — shared hook, không feature-specific
export function useSession() {
  // Trả về session data dùng cross-feature
}
```

### 9.2 `src/lib/` — Shared FE Infrastructure

**Trách nhiệm:** HTTP client config, pure utilities, auth helpers, format functions, constants dùng cross-app.

**Rules:**
- **Không** import từ bất kỳ `features/*/` nào
- **Không** import React hooks (trừ `lib/` files là React context/provider)
- Các file trong `lib/server/` chỉ chạy trên server side (Next.js Server Components/Actions)
- Ví dụ: `http.ts`, `utils.ts`, `format.ts`, `api-paths.ts`

```ts
// apps/admin/src/lib/http.ts — HTTP client config thuần
import ky from "ky";
export const http = ky.create({ prefixUrl: "/api/bff" });
```

### 9.3 `src/components/` — Shared Shell & Layout Components

**Trách nhiệm:** Shell layout, navigation, providers — shared across toàn bộ app.

**Rules:**
- **Không** import từ `features/*/` (chỉ nhận data qua props nếu cần)
- Chỉ chứa app-level layout/shell components, không chứa feature logic
- Ví dụ: `admin-shell/`, `providers.tsx`

---

## 10. FE Dependency Matrix

> Ai được phép import từ ai. `→` = được phép. `✗` = vi phạm.

| Layer | Route | Screen | Handler | API | Model | UI | hooks/ | lib/ |
|-------|-------|--------|---------|-----|-------|----|--------|------|
| **Route** | — | ✅ → Screen | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Screen** | ✗ | — | ✅ → Handler | ✗ | ✗ | ✅ → UI | ✅ | ✅ |
| **Handler** | ✗ | ✗ | — | ✅ → API | ✅ → Model | ✗ | ✅ | ✅ |
| **API** | ✗ | ✗ | ✗ | — | ✅ → Model (types) | ✗ | ✗ | ✅ |
| **Model** | ✗ | ✗ | ✗ | ✗ | — | ✗ | ✗ | ✅ (pure utils only) |
| **UI** | ✗ | ✗ | ✗ | ✗ | ✅ → Model (types only) | ✅ same feature | ✅ | ✅ |
| **hooks/** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | — | ✅ |
| **lib/** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | — |

**Ngoài ra:**
- Tất cả layers được phép import từ `@repo/web-ui` (design system) và `@repo/api-contract` (types).
- **Không** feature nào được import từ feature khác trực tiếp — dùng `packages/` nếu cần share.

---

## 11. BE Clean Architecture Rules

### Dependency Direction (bất biến)

```
Presentation → Application → Domain
                    ↓
               App Ports ← Infrastructure
```

**Quy tắc cốt lõi:** Dependency chỉ được đi từ ngoài vào trong. Infrastructure implement Ports — không phải ngược lại. Domain không được biết về bất kỳ framework/DB nào.

### 11.1 Presentation Layer (presentation/)

**Trách nhiệm:** Nhận HTTP request, validate DTO, gọi Use Case, trả response.

**File pattern:** `*.controller.ts` trong `modules/<domain>/presentation/`

| # | Rule |
|---|------|
| R1 | Chỉ gọi **Use Case** — không gọi Repository Port hay Domain trực tiếp |
| R2 | Parse và validate input bằng DTO (class-validator/zod) — không business logic |
| R3 | **Không** import Drizzle schema hay Database types |
| R4 | Nếu cần guard/permission, dùng NestJS Guard — không viết permission logic trong controller |
| R5 | Error handling: dùng NestJS exception filters — không try/catch thủ công ở đây |

**Naming:** `<action>.<domain>.controller.ts` → Class: `<Domain>Controller`

✅ **DO**
```ts
// apps/api/src/identity/modules/auth/presentation/auth.controller.ts
@Controller("auth")
export class AuthController {
  constructor(private readonly loginUseCase: LoginUseCase) {}

  @Post("login")
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    // Controller chỉ parse + delegate — không business logic
    return this.loginUseCase.execute(
      { email: dto.email, password: dto.password },
      extractRequestContext(req),
    );
  }
}
```

❌ **DON'T**
```ts
// WRONG: Controller chứa business logic
@Post("login")
async login(@Body() dto: LoginDto) {
  const user = await this.usersRepository.findByEmail(dto.email); // ← vi phạm R1 — gọi repo trực tiếp
  if (!user || user.status === "BLOCKED") {                       // ← vi phạm R2 — business logic
    throw new UnauthorizedException();
  }
}
```

---

### 11.2 Application Layer (application/use-cases/)

**Trách nhiệm:** Orchestration — điều phối Domain và Ports, quản lý transaction boundary, side effects (audit, notification).

**File pattern:** `<action>.use-case.ts` trong `modules/<domain>/application/use-cases/`

| # | Rule |
|---|------|
| R1 | **Không** import `express.Request`, `Response`, hay bất kỳ HTTP type nào |
| R2 | **Không** import Drizzle schema hay raw SQL |
| R3 | Inject dependencies qua constructor (NestJS DI) — không `new` concrete class |
| R4 | Là nơi duy nhất được phép bắt đầu transaction (`TransactionExecutor`) |
| R5 | Throw `AppError` (domain error) — không throw `HttpException` trực tiếp |
| R6 | Application Service (`*.service.ts`) được phép khi orchestration cần share giữa nhiều Use Cases |

**Naming:** `<action>.use-case.ts` → Class: `<Action>UseCase`

✅ **DO** (từ codebase thực tế)
```ts
// apps/api/src/identity/modules/auth/application/use-cases/login.use-case.ts
@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepositoryPort, // Inject Port — không phải concrete impl
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    private readonly mfaService: MfaService,
  ) {}

  async execute(input: LoginCommand, requestContext?: RequestContext) {
    // Use Case orchestrate — không có HTTP types, không có raw SQL
    const user = await this.usersRepository.findByEmail(normalizeEmail(input.email));

    if (!user || !(await verifyPassword(user.passwordHash, input.password))) {
      throw new AppError(ERROR_CODES.AUTH_INVALID_CREDENTIALS, "Invalid credentials", HttpStatus.UNAUTHORIZED);
    }
    // ...
  }
}
```

❌ **DON'T**
```ts
// WRONG 1: Use Case import HTTP types
import { Request, Response } from "express"; // ← vi phạm R1

// WRONG 2: Use Case import Drizzle
import { db } from "@/db/drizzle";
import { usersTable } from "@/db/schema"; // ← vi phạm R2

// WRONG 3: Use Case new concrete class (breaks DI)
const repo = new DrizzleUsersRepository(db); // ← vi phạm R3 — dùng @Inject
```

---

### 11.3 Domain Layer (domain/)

**Trách nhiệm:** Business rules và invariants thuần — zero framework dependency.

**File pattern:** `*.entity.ts`, `*.policy.ts` trong `modules/<domain>/domain/`

| # | Rule |
|---|------|
| R1 | **Zero** framework dependency — không import NestJS, Drizzle, Express, hay bất kỳ infrastructure package nào |
| R2 | Chứa business invariants — validation, state transitions, business rules |
| R3 | **Không** throw HTTP exceptions — throw plain `Error` hoặc domain-specific errors |
| R4 | Không async (trừ khi business rule thực sự cần) — business logic là synchronous |

**Naming:** `<domain>.entity.ts`, `<domain>.policy.ts` → Class: `<Domain>Entity`, `<Domain>Policy`

✅ **DO**
```ts
// apps/api/src/identity/modules/users/domain/user.entity.ts

// Domain entity — không có import từ NestJS hay Drizzle
export class UserEntity {
  constructor(private readonly data: UserRecord) {}

  // Business invariant — bất biến của domain
  canLogin(): boolean {
    return this.data.status === "ACTIVE" && this.data.emailVerifiedAt !== null;
  }

  isBlocked(): boolean {
    return this.data.status === "BLOCKED";
  }
}
```

❌ **DON'T**
```ts
// WRONG: Domain import NestJS
import { Injectable } from "@nestjs/common"; // ← vi phạm R1

// WRONG: Domain throw HTTP exception
import { UnauthorizedException } from "@nestjs/common"; // ← vi phạm R1, R3

export class UserPolicy {
  validate(user: User) {
    if (!user.isActive()) throw new UnauthorizedException(); // ← vi phạm R3
  }
}
```

---

### 11.4 App Ports Layer (application/ports/)

**Trách nhiệm:** Định nghĩa interface contract cho Data Access và External Services.

**File pattern:** `<resource>.repository.port.ts` trong `modules/<domain>/application/ports/`

| # | Rule |
|---|------|
| R1 | Chỉ là TypeScript **interface** — không implement bất kỳ thứ gì |
| R2 | **Không** import Drizzle, HTTP client, hay bất kỳ infrastructure package nào |
| R3 | Định nghĩa rõ ràng input/output types — không dùng `any` |
| R4 | Kèm theo injection token constant (VD: `export const USERS_REPOSITORY = Symbol(...)`) |

✅ **DO** (từ codebase thực tế)
```ts
// apps/api/src/identity/modules/auth/application/ports/auth-session.repository.port.ts
import type { TransactionExecutor } from "@repo/api-core";
import type { AuthSessionModel, CreateSessionInput } from "../models/auth-session";

// Chỉ là interface — không có implementation
export interface AuthSessionRepositoryPort {
  createSession(values: CreateSessionInput, tx?: TransactionExecutor): Promise<AuthSessionModel | null>;
  findSessionById(sessionId: string, tx?: TransactionExecutor): Promise<AuthSessionModel | null>;
  updateSession(sessionId: string, values: Partial<CreateSessionInput>, tx?: TransactionExecutor): Promise<AuthSessionModel | null>;
}

export const AUTH_SESSION_REPOSITORY = Symbol("AuthSessionRepositoryPort");
```

❌ **DON'T**
```ts
// WRONG 1: Port chứa implementation
export interface UsersRepositoryPort {
  findByEmail(email: string): Promise<User | null> {
    // Ports không có implementation — chỉ là interface
    return db.select().from(usersTable).where(eq(usersTable.email, email)); // ← vi phạm R1
  }
}

// WRONG 2: Port import Drizzle
import { db } from "@/db"; // ← vi phạm R2
```

---

### 11.5 Infrastructure Layer (infrastructure/)

**Trách nhiệm:** Concrete implementations của Ports — Drizzle repositories, HTTP adapters, email adapters, S3 adapters.

**File pattern:**
```
modules/<domain>/infrastructure/
  ├── <resource>.repository.ts  # Drizzle implementation
  └── <service>.adapter.ts      # External service adapter
```

> **Naming (thực tế trong repo):** repository file dùng `<resource>.repository.ts`
> và class `<Resource>Repository` (VD: `users.repository.ts` →
> `UsersRepository`). Không dùng tiền tố `drizzle-`/`Drizzle` — mọi repository
> đã là Drizzle-backed nên tiền tố không thêm thông tin.

| # | Rule |
|---|------|
| R1 | Implement Port interface (`implements <Resource>RepositoryPort`) |
| R2 | Drizzle queries chỉ ở đây — **không** ở Use Case hay Domain |
| R3 | **Không** chứa business logic — chỉ data access logic |
| R4 | **Không** throw domain errors — throw infrastructure errors; Use Case translate |
| R5 | Đăng ký vào NestJS module với injection token từ Port |

✅ **DO**
```ts
// apps/api/src/identity/modules/users/infrastructure/users.repository.ts
@Injectable()
export class UsersRepository implements UsersRepositoryPort {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  // Infrastructure chứa raw Drizzle query — không business logic
  async findByEmail(email: string): Promise<UserRecord | null> {
    const [user] = await this.database
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return user ?? null;
  }
}
```

❌ **DON'T**
```ts
// WRONG 1: Infrastructure chứa business logic
async findByEmail(email: string) {
  const user = await this.db.query.users.findFirst({ where: eq(...) });
  // Business logic không thuộc infrastructure
  if (!user?.emailVerifiedAt) {               // ← vi phạm R3
    throw new AppError("Email not verified"); // ← vi phạm R4 — throw domain error
  }
  return user;
}

// WRONG 2: Use Case chứa Drizzle query (bypass Infrastructure)
// packages/.../use-cases/create-user.use-case.ts
async execute(input: CreateUserCommand) {
  await db.insert(usersTable).values(input); // ← vi phạm R2 — SQL thuộc Infrastructure
}
```

### 11.6 DI Wiring (`<domain>.module.ts`)

- Module wiring thuộc về NestJS module của mỗi Bounded Context
  (VD: `apps/api/src/identity/modules/users/users.module.ts`,
  `apps/api/src/platform/modules/notifications/notifications.module.ts`) —
  không hardcode dependency trong Use Case. `apps/api/src/shell/` chỉ chứa
  cross-cutting infra (guard, interceptor), không phải nơi wiring repository.
- Mỗi Bounded Context có NestJS Module riêng (VD: `AuthModule`, `UsersModule`)
- Infrastructure providers đăng ký với token từ Port. Repository được khai báo
  một lần rồi bind vào token qua `useExisting` (không tạo instance thứ hai):
  ```ts
  providers: [
    UsersRepository,
    { provide: USERS_REPOSITORY, useExisting: UsersRepository },
  ]
  ```

---

## 12. DB & External Service Rules

### 12.1 Port-First Pattern

> **Mọi** truy cập DB và external service phải có Port interface trước khi có implementation.

**Lý do:** Testability (mock Port trong unit test), swappability (đổi implementation mà không ảnh hưởng business logic), clear contracts.

✅ **DO**
```
1. Tạo interface: modules/<domain>/application/ports/<resource>.repository.port.ts
2. Tạo implementation: modules/<domain>/infrastructure/<resource>.repository.ts
3. Đăng ký DI trong Module
```

❌ **DON'T**
```ts
// WRONG: Use Case inject concrete implementation trực tiếp
constructor(private readonly repo: UsersRepository) {} // ← inject Port, không phải implementation
```

---

### 12.2 No Raw Queries Outside Infrastructure

> Drizzle queries (`db.select()`, `db.insert()`, `db.update()`, `db.delete()`) chỉ được phép trong `infrastructure/` layer.

🔒 **SECURITY:** Drizzle schema (table definitions) **không được import** ra ngoài Infrastructure — schema là internal detail của infrastructure.

✅ **DO:** Tất cả raw queries trong `<resource>.repository.ts`

❌ **DON'T**
```ts
// WRONG: Use Case import Drizzle schema
import { usersTable } from "@repo/api-database/schema"; // ← vi phạm

@Injectable()
export class GetUserUseCase {
  async execute(userId: string) {
    // SQL không được ở đây — đây là việc của Infrastructure
    return this.db.select().from(usersTable).where(eq(usersTable.id, userId));
  }
}
```

---

### 12.3 Adapter Pattern cho External Services

> HTTP clients, S3, Email, Message Queue đều là **Adapters** implement Port tương ứng.

```
Port interface (application/ports/)  →  Adapter (infrastructure/)
EmailSenderPort                      →  ResendEmailAdapter / SmtpEmailAdapter
FileStoragePort                      →  S3FileStorageAdapter
NotificationQueuePort                →  BullMQNotificationAdapter
```

✅ **DO**
```ts
// Port
export interface EmailSenderPort {
  sendEmail(to: string, subject: string, html: string): Promise<void>;
}
export const EMAIL_SENDER = Symbol("EmailSenderPort");

// Adapter
@Injectable()
export class ResendEmailAdapter implements EmailSenderPort {
  async sendEmail(to: string, subject: string, html: string) {
    await this.resendClient.emails.send({ from: "...", to, subject, html });
  }
}
```

❌ **DON'T**
```ts
// WRONG: Use Case gọi external service trực tiếp
import { Resend } from "resend"; // ← vi phạm — inject EmailSenderPort thay thế

@Injectable()
export class SendWelcomeEmailUseCase {
  constructor(private readonly resend: Resend) {} // ← vi phạm Adapter pattern
}
```

---

### 12.4 Error Translation Rule

> Infrastructure không throw domain errors (`AppError` với business meaning). Chỉ throw infrastructure-level errors.

**Flow:** `Infrastructure` throws `DatabaseError` / `NetworkError` → `Use Case` catches và translates → throws `AppError` (domain meaning).

✅ **DO**
```ts
// Infrastructure: throw infrastructure error
async findByEmail(email: string) {
  try {
    return await this.db.query.users.findFirst({ where: eq(...) });
  } catch (err) {
    throw new DatabaseError("Failed to query users", { cause: err });
  }
}

// Use Case: translate to domain error
async execute(input: LoginCommand) {
  const user = await this.usersRepository.findByEmail(input.email);
  // Use Case xử lý business meaning, không expose DB error
  if (!user) throw new AppError(ERROR_CODES.AUTH_INVALID_CREDENTIALS, "...", 401);
}
```

---

## 13. ESLint Enforcement

### Mục tiêu

Tự động enforce layer dependency rules để phát hiện vi phạm ở CI/pre-commit.

### Recommended config với `eslint-plugin-boundaries`

```js
// packages/eslint-config/index.js (hoặc eslint.config.mjs)
import boundaries from "eslint-plugin-boundaries";

export default [
  {
    plugins: { boundaries },
    settings: {
      "boundaries/elements": [
        { type: "route", pattern: "app/**/page.tsx" },
        { type: "screen", pattern: "features/*/screens/**" },
        { type: "handler", pattern: "features/*/controllers/**" },
        { type: "api", pattern: "features/*/api/**" },
        { type: "model", pattern: "features/*/model/**" },
        { type: "ui", pattern: "features/*/ui/**" },
        { type: "shared-hooks", pattern: "hooks/**" },
        { type: "lib", pattern: "lib/**" },
      ],
    },
    rules: {
      "boundaries/element-types": ["error", {
        default: "disallow",
        rules: [
          { from: "route", allow: ["screen"] },
          { from: "screen", allow: ["handler", "ui", "shared-hooks", "lib"] },
          { from: "handler", allow: ["api", "model", "shared-hooks", "lib"] },
          { from: "api", allow: ["model", "lib"] },
          { from: "model", allow: ["lib"] },
          { from: "ui", allow: ["model", "ui", "lib", "shared-hooks"] },
        ],
      }],
    },
  },
];
```

⚠️ **NOTE:** Kiểm tra compatibility với version ESLint và config format hiện tại của project trước khi apply. Nếu chưa sẵn sàng, ít nhất document rules để code review thủ công.

---

## 14. Naming Quick Reference

### FE Naming

| Layer | File pattern | Component/Function | Ví dụ |
|-------|-------------|---------------------|-------|
| Route | `page.tsx` | default export | N/A |
| Screen | `<feature>-view.tsx` | `<Feature>View` | `UsersView` |
| Handler | `use<Feature>Handlers.ts` | `use<Feature>Handlers` | `useUsersHandlers` |
| API fetch | `<feature>.api.ts` | `<feature>Api` object | `usersApi.list()` |
| API query | `<feature>.queries.ts` | `use<Feature><Action>Query` | `useUsersListQuery` |
| API mutation | `<feature>.mutations.ts` | `use<Action><Feature>` | `useCreateUser` |
| Query keys | `<feature>.query-keys.ts` | `<feature>Keys` | `usersKeys.list()` |
| Model types | `<feature>.types.ts` | Interface/Type | `UserRecord` |
| Model schema | `<feature>.schemas.ts` | `create<Resource>Schema` | `createUserSchema` |
| Model permissions | `<feature>.permissions.ts` | `select<Resource>Permissions` | `selectUserManagementPermissions` |
| UI list | `<feature>-list-view.tsx` | `<Feature>ListView` | `UsersListView` |
| UI table | `<feature>-table.tsx` | `<Feature>Table` | `UsersTable` |

### BE Naming

| Layer | File pattern | Class | Ví dụ |
|-------|-------------|-------|-------|
| Controller | `<domain>.controller.ts` | `<Domain>Controller` | `AuthController` |
| Use Case | `<action>.use-case.ts` | `<Action>UseCase` | `LoginUseCase` |
| App Service | `<domain>.service.ts` | `<Domain>Service` | `MfaService` |
| Entity | `<domain>.entity.ts` | `<Domain>Entity` | `UserEntity` |
| Policy | `<domain>.policy.ts` | `<Domain>Policy` | `PasswordPolicy` |
| Port | `<resource>.repository.port.ts` | Interface `<Resource>RepositoryPort` | `UsersRepositoryPort` |
| Repository | `<resource>.repository.ts` | `<Resource>Repository` | `UsersRepository` |
| Adapter | `<service>.adapter.ts` | `<Service>Adapter` | `ResendEmailAdapter` |

---

## 15. FE Validation Rules

### Trách nhiệm

Mọi dữ liệu **đi vào** ứng dụng từ bên ngoài đều không đáng tin: form người dùng nhập, route params, search params, `localStorage`, `postMessage`, và response từ BFF. Validation là lớp biến dữ liệu không tin cậy thành dữ liệu có kiểu, **trước khi** nó chạm tới state hoặc query.

> **Validation ở FE là UX, không phải bảo mật.** Người dùng có thể bỏ qua toàn bộ FE bằng `curl`. BE **luôn** phải validate lại (§11.1 R2). FE validate để báo lỗi sớm và để app không vỡ — không bao giờ để "chặn" kẻ tấn công.

### Ba nhóm dữ liệu vào — ba cách xử lý khác nhau

| Nhóm | Ví dụ | Khi giá trị sai | Lý do |
|------|-------|-----------------|-------|
| **Identity params** (route) | `/users/[id]`, `/orgs/[slug]` | **Không fallback** → `notFound()` | URL trỏ tới một resource cụ thể; sai nghĩa là không có gì để hiển thị |
| **Presentation params** (search) | `?page=`, `?status=`, `?from=`, `?sort=`, `?search=` | **Luôn fallback theo từng key** | Params chỉ điều khiển cách hiển thị; một key hỏng không được làm trắng màn hình |
| **Payload người dùng** | form create/update | Chặn submit + hiện lỗi theo field | Người dùng cần sửa được, không phải mất dữ liệu đã nhập |

### Rules

| # | Rule |
|---|------|
| R1 | Mọi dữ liệu ngoài (form, URL, storage, message) phải qua schema **trước khi** vào state, query key, hay request |
| R2 | Schema khai báo ở `model/*.schemas.ts` (form) và `model/*.search-params.ts` (params). **Không** import `zod` trong `ui/`, `screens/`, `controllers/` — import schema đã khai báo (ESLint `warn`) |
| R3 | Route params dùng `parseRouteParams()` → `ok: false` thì gọi `notFound()`, **không** đoán giá trị thay thế |
| R4 | Search params dùng `parseSearchParams()` — **cấm** đọc thô `searchParams.get(...)` rồi ép kiểu (ESLint `warn`) |
| R5 | Giá trị fallback là hằng số trong `model/constants.ts` (`DEFAULT_*`), không rải literal khắp nơi |
| R6 | Response BFF: tin type sinh từ `@repo/api-contract`. Chỉ `zod.parse()` ở **biên rủi ro**: dữ liệu quyết định phân quyền, số tiền, hoặc nội dung sắp render dạng HTML |
| R7 | Params dùng để điều hướng (`returnTo`, `redirect`, `next`) phải qua `internalPath()` — xem §20 |
| R8 | Free-text param phải có giới hạn độ dài; enum param phải là whitelist đóng, không blacklist |

### Param primitives dùng chung

`@repo/web-utils/params` cung cấp sẵn các mảnh để ghép schema — đừng viết lại guard cho từng feature:

| Helper | Dùng cho | Khi giá trị sai |
|--------|----------|-----------------|
| `pageParam` | `?page=` | → `1` |
| `pageSizeParam([10,20,50], 20)` | `?limit=` | → default đã khai báo |
| `enumParam(["ALL","ACTIVE"], "ALL")` | filter trạng thái | → fallback |
| `searchTextParam(200)` | `?search=` | → `""` (và cắt độ dài) |
| `dateParam` | `?from=`, `?to=` | → `undefined` |
| `booleanParam` | `?archived=` | → `false` |
| `sortOrderParam("desc")` | `?sortOrder=` | → default |
| `uuidParam` / `numericIdParam` / `slugParam` | route id | → **không fallback**, `notFound()` |
| `internalPath(value, "/users")` | `?returnTo=` | → path an toàn |

### ✅ DO

```ts
// features/users/model/users.search-params.ts — schema đặt ở model, một chỗ duy nhất
// (users hiện đang parse thủ công bằng whitelist — dạng dưới là đích migrate)
import {
  enumParam,
  pageParam,
  pageSizeParam,
  parseSearchParams,
  searchTextParam,
  sortOrderParam,
} from "@repo/web-utils/params";
import { z } from "zod";

import { DEFAULT_USERS_LIST_PARAMS, USERS_PAGE_SIZE } from "./constants";

export const usersListParamsSchema = z.object({
  page: pageParam,
  limit: pageSizeParam([10, 20, 30, 50, 100], USERS_PAGE_SIZE),
  search: searchTextParam(200),
  status: enumParam(["all", "PENDING", "ACTIVE", "BLOCKED"], "all"),
  sortField: enumParam(["createdAt", "displayName", "email", "status"], "createdAt"),
  sortOrder: sortOrderParam("desc"),
});

export function parseUsersListSearchParams(searchParams: URLSearchParams) {
  // Recovery theo từng key: `?page=xx&status=ACTIVE` vẫn giữ filter ACTIVE
  // và chỉ đưa page về 1 — không reset cả màn hình.
  return parseSearchParams(usersListParamsSchema, searchParams, DEFAULT_USERS_LIST_PARAMS);
}
```

```tsx
// Route param là identity — sai thì không có fallback nào hợp lý
import { parseRouteParams, uuidParam } from "@repo/web-utils/params";
import { notFound } from "next/navigation";
import { z } from "zod";

const paramsSchema = z.object({ id: uuidParam });

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const parsed = parseRouteParams(paramsSchema, await params);

  // `/users/xx` → không gọi API với id rác, không hiện lỗi 500 mơ hồ.
  // Lưu ý status code: gọi notFound() TRƯỚC mọi <Suspense>/await có thể
  // suspend, nếu không response đã stream với 200 (xem §18.3).
  if (!parsed.ok) {
    notFound();
  }

  return <UserDetailView userId={parsed.data.id} />;
}
```

```ts
// Return param — không bao giờ tin thẳng
// apps/admin/src/features/users/controllers/use-user-detail-controller.ts
const backHref = internalPath(searchParams.get("returnTo"), "/users");
```

### ❌ DON'T

```ts
// WRONG 1: đọc thô rồi ép kiểu — `?page=xx` cho ra NaN và NaN đi thẳng vào query key
const page = Number(searchParams.get("page"));          // ← vi phạm R4
const limit = Number(searchParams.get("limit")) || 20;  // ← `?limit=99999` lọt qua

// WRONG 2: coi cast là validate — TypeScript không kiểm tra lúc chạy
const status = searchParams.get("status") as UserStatus; // ← vi phạm R1
// `?status=DROP_TABLE` giờ là "UserStatus" hợp lệ với compiler

// WRONG 3: một key hỏng làm hỏng cả màn hình
const params = usersListParamsSchema.parse(raw); // ← throw → error boundary → mất filter
// Dùng parseSearchParams() để recovery theo key (R4)

// WRONG 4: khai báo schema ngay trong component
export function CreateUserDrawer() {
  const schema = z.object({ email: z.string() }); // ← vi phạm R2, tạo lại mỗi lần render
}

// WRONG 5: route param sai nhưng vẫn đoán bừa
const id = params.id || "1"; // ← vi phạm R3 — hiển thị nhầm resource của người khác
```

---

## 16. FE Shared Hook Composition Rules

### Nguyên tắc

Hook dùng chung phải **phẳng**. Một shared hook gọi shared hook khác sẽ giấu một nguồn dữ liệu bên trong một cái lá: người đọc màn hình không thấy được nó fetch cái gì, test phải mock lồng nhiều tầng, và cùng một dữ liệu bị lấy ở nhiều điểm với vòng đời khác nhau.

### Rules

| # | Rule |
|---|------|
| R1 | Hook trong `src/hooks/` **không** được import hook khác trong `src/hooks/` (ESLint `error`) |
| R2 | Hook trong `src/hooks/` **không** được import từ `features/*` — nó là hạ tầng cross-feature (ESLint `error`) |
| R3 | Shared hook (`useSession`, …) gọi **một lần ở root handler** của màn hình; sub-hook nhận dữ liệu qua **tham số**, không tự gọi lại |
| R4 | Sub-hook trong `controllers/` nhận input là giá trị/hàm đã có sẵn — nó không được là nơi đầu tiên khám phá ra session, permission, hay params |
| R5 | Nếu hai sub-hook cùng cần một dữ liệu → nâng lên root handler và truyền xuống, **không** cùng gọi shared hook |

> **Ghi chú về React Query:** `useSession()` dùng chung `queryKey` nên gọi nhiều lần *không* tạo thêm request. Rule này không nhằm tiết kiệm request — nó nhằm giữ **một điểm đọc dữ liệu duy nhất cho mỗi màn hình**, để luồng đọc được từ trên xuống và test không phải mock ở ba tầng.

### ✅ DO

```ts
// Root handler gọi shared hook một lần…
export function useUsersListController(): UsersListViewModel {
  const session = useSession();       // ← điểm đọc session duy nhất của màn hình
  const searchParams = useSearchParams();

  const { canCreate, canUpdate } = selectUserManagementPermissions(
    session.data?.data.permissions,
  );

  // …rồi truyền kết quả xuống sub-hook
  const { isMutating, handleBulkActivate } = useUsersBulkActions(
    activateUsers,
    blockUsers,
    requestBlock,
  );
}
```

```ts
// apps/admin/src/features/users/controllers/use-user-roles.ts
// Sub-hook thuần: mọi thứ nó cần đều đến từ tham số — không gọi useSession,
// không gọi query. Test được bằng cách truyền object thường.
export function useUserRoles(
  userId: string | undefined,
  currentUser: AdminUserDto | null,
  replaceRoles: { isPending: boolean; mutateAsync: (a: Args) => Promise<unknown> },
  isActorSuperAdmin: boolean,
  actorOrganizationId: string | null | undefined,
  // …
) { /* chỉ state cục bộ + tính toán dẫn xuất */ }
```

### ❌ DON'T

```ts
// WRONG 1: shared hook gọi shared hook — vi phạm R1
// src/hooks/use-bulk-mutation.ts
import { useSession } from "@/hooks/use-session"; // ← ESLint error
export function useBulkMutation() {
  const session = useSession(); // giấu một nguồn dữ liệu trong một tiện ích
}

// WRONG 2: sub-hook tự đi tìm session — vi phạm R3, R4
// features/users/controllers/use-users-bulk-actions.ts
export function useUsersBulkActions() {
  const session = useSession();        // ← root handler đã có session rồi
  const canUpdate = session.data?.data.permissions.includes("users.update");
  // Giờ quyền được tính ở hai nơi và có thể lệch nhau
}

// WRONG 3: hai sub-hook cùng gọi một shared hook — vi phạm R5
useUsersTableConfig();   // bên trong: useSession()
useUsersConfirmBlock();  // bên trong: useSession()
// → nâng lên root handler, truyền xuống

// WRONG 4: shared hook biết về feature — vi phạm R2
// src/hooks/use-session.ts
import { usersKeys } from "@/features/users/api/users.query-keys"; // ← ESLint error
```

---

## 17. FE Handler Splitting & Flow Comments

### Khi nào phải tách

Handler (`controllers/`) phình to là chuyện bình thường với feature lớn — vấn đề chỉ xuất hiện khi **một file gánh nhiều nhóm trách nhiệm**. Ngưỡng cụ thể:

| Tín hiệu | Ngưỡng | Hành động |
|----------|--------|-----------|
| Số dòng file handler | > 250 | Tách sub-hook |
| Số nhóm trong view model | > 6 nhóm | Tách theo nhóm |
| Số `useState` trong một hook | > 5 | Gom state cùng vòng đời vào sub-hook |
| Một nhóm hành vi có ≥ 2 handler + state riêng | — | Tách ngay, không cần đợi ngưỡng dòng |

### Tách theo cái gì

**Tách theo nhóm hành vi (behaviour), không theo kỹ thuật.** Sub-hook phải trả lời được câu "nó sở hữu chuyện gì". `use-users-bulk-actions` là tên tốt; `use-users-utils` hay `use-users-helpers` là tên xấu — chúng không có ranh giới, nên rồi thứ gì cũng rơi vào đó.

Ví dụ thật trong repo — `use-users-list-controller.ts` (307 dòng) đã tách:

```
controllers/
  use-users-list-controller.ts   # root: compose + trả UsersListViewModel
  use-users-bulk-actions.ts      #   sở hữu: chọn nhiều + activate/block hàng loạt
  use-users-confirm-block.ts     #   sở hữu: state dialog xác nhận block
  use-users-table-config.ts      #   sở hữu: cấu hình TanStack Table + row selection
```

### Rules

| # | Rule |
|---|------|
| R1 | Root handler chỉ **compose** sub-hook và trả về view model — không chứa logic của một nhóm cụ thể |
| R2 | Sub-hook đặt cùng thư mục `controllers/`, tên `use-<feature>-<concern>.ts` — `<concern>` là danh từ nghiệp vụ |
| R3 | Sub-hook nhận input qua tham số (§16 R4) và trả về đúng phần view model nó sở hữu |
| R4 | Cấm sub-hook tên chung chung: `-utils`, `-helpers`, `-misc`, `-common` |
| R5 | Root handler **bắt buộc** có flow comment ở đầu file (xem dưới) |
| R6 | Mỗi sub-hook có một dòng comment nêu rõ nó **sở hữu** cái gì |
| R7 | Sub-hook không import sub-hook khác cùng cấp — chỉ root mới compose (tránh chồng chéo như §16) |

### Flow comment — bắt buộc ở root handler

Người đọc phải nắm được luồng trong 10 giây mà không cần mở 4 file. Format:

```ts
/**
 * Users list — root handler.
 *
 * Flow:
 *  1. URL → parseUsersListSearchParams() → listParams đã validate (§15 R4)
 *  2. Ô tìm kiếm debounce 500ms → patchListParams() → router.replace()
 *  3. listParams → useUsersListQuery() → dữ liệu trang hiện tại
 *  4. session → selectUserManagementPermissions() → canCreate / canUpdate
 *  5. Compose: useUsersTableConfig (bảng) + useUsersBulkActions (hàng loạt)
 *              + useUsersConfirmBlock (dialog xác nhận)
 *  6. Trả UsersListViewModel — screen chỉ render, không tính toán
 *
 * Sở hữu bởi file này: đồng bộ URL ↔ state, phân trang, filter.
 * KHÔNG sở hữu: cấu hình bảng, chọn hàng loạt, dialog xác nhận (xem sub-hook).
 */
export function useUsersListController(): UsersListViewModel {
```

Quy tắc viết flow comment:
- Đánh **số bước** theo đúng thứ tự dữ liệu chảy, không phải thứ tự code.
- Nêu rõ **sở hữu / không sở hữu** — đây là phần chống chồng chéo trách nhiệm.
- Cập nhật comment **trong cùng commit** với thay đổi luồng. Comment sai còn tệ hơn không có.
- Không mô tả cú pháp (`// gọi useState`) — chỉ mô tả luồng nghiệp vụ.

### ❌ DON'T

```ts
// WRONG 1: tách theo kỹ thuật, không theo trách nhiệm
use-users-utils.ts        // ← vi phạm R4 — rồi mọi thứ sẽ rơi vào đây
use-users-state.ts        // ← "state" không phải một nhóm nghiệp vụ

// WRONG 2: sub-hook gọi sub-hook — vi phạm R7
export function useUsersBulkActions() {
  const { table } = useUsersTableConfig(); // ← chồng chéo, root mất quyền kiểm soát
}

// WRONG 3: root handler vẫn ôm logic chi tiết
export function useUsersListController() {
  const [rowSelection, setRowSelection] = useState({});
  const table = useReactTable({ /* 60 dòng cấu hình */ }); // ← vi phạm R1
}

// WRONG 4: flow comment kể lại cú pháp
/**
 * Hook này dùng useState và useEffect và gọi useQuery.  ← vô dụng
 */
```

---

## 18. FE Error Handling Strategy

### 18.1 Ba tầng lỗi

| Tầng | Bề mặt | Dùng khi | Ai kích hoạt |
|------|--------|----------|--------------|
| **Global** | `global-error.tsx`, `[locale]/error.tsx` | App shell vỡ, session hết hạn, mất quyền | React error boundary bắt lỗi render |
| **Local** | `<ErrorState variant="full-page">` trong view model (`list.isError` + `onRetry`) | Một section/query hỏng nhưng phần còn lại của trang vẫn dùng được | Handler đọc `query.isError` |
| **Inline** | `toast`, lỗi theo field trong form | Hành động của người dùng thất bại, ngữ cảnh nằm ngay tại control | Handler bắt lỗi mutation |

Chọn tầng bằng `classifyError()` (`@repo/web-utils/errors`) thay vì tự đoán từ status:

| `kind` | status | scope | retry |
|--------|--------|-------|-------|
| `auth` | 401 | global | ✗ |
| `permission` | 403 | global | ✗ |
| `not-found` | 404 | local | ✗ |
| `validation` | 400/422 | inline | ✗ |
| `conflict` | 409 | inline | ✓ |
| `rate-limit` | 429 | inline | ✓ |
| `server` | ≥500 | local | ✓ |
| `network` | — | local | ✓ |

### 18.2 Error boundary trong Next.js App Router

```
apps/admin/src/app/
  global-error.tsx          # root layout vỡ → tự render <html>/<body>, không có provider
  [locale]/error.tsx        # bắt mọi lỗi render của page + layout con
  [locale]/not-found.tsx    # UI 404
  [locale]/(app)/error.tsx  # (tuỳ chọn) giữ nguyên sidebar khi chỉ nội dung lỗi
```

| # | Rule |
|---|------|
| R1 | File error boundary **bắt buộc** `"use client"` |
| R2 | `error.tsx` **không** bắt lỗi của `layout.tsx` cùng segment — lỗi đó bay lên boundary cha |
| R3 | `global-error.tsx` thay thế root layout → phải tự khai báo `<html>`/`<body>`, không dùng được provider, i18n, theme |
| R4 | Dùng prop **`unstable_retry`** (Next ≥ 16.2) để thử lại — nó re-fetch và re-render segment. `reset` chỉ dùng khi cố ý **không** muốn fetch lại |
| R5 | Error boundary **không** bắt lỗi trong event handler và async code → phải `try/catch` thủ công rồi đưa vào state |
| R6 | Luôn log `error.digest` — ở production, lỗi từ Server Component chỉ còn message chung, `digest` là móc nối duy nhất tới log server |

```tsx
// apps/admin/src/app/[locale]/error.tsx
"use client";

export default function LocaleError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[admin] unhandled render error", {
      digest: error.digest,
      message: error.message,
    });
  }, [error]);

  return <ErrorFallback error={error} onRetry={unstable_retry} />;
}
```

### 18.3 Status code: server-side vs client-side ⚠️

Đây là chỗ hay hiểu sai nhất. **Status code chỉ tồn tại ở request HTML đầu tiên.** Điều hướng phía client (`<Link>`, `router.push`) không sinh ra status code nào cả — nó chỉ tải RSC payload, nên `notFound()` lúc đó chỉ đổi UI.

| Tình huống | Status thực tế | Ghi chú |
|------------|----------------|---------|
| SSR, `notFound()` chạy **trước khi** body stream | `404` thật | Muốn có status này phải chặn sớm |
| SSR, `notFound()` chạy **sau khi** đã stream | `200` + `<meta name="robots" content="noindex">` | "Soft 404" — header đã gửi, không sửa được nữa |
| Lỗi render bắt bởi `error.tsx` khi SSR | `500` | Chỉ khi chưa stream |
| Điều hướng client-side | **không có status** | Chỉ là fetch RSC payload |

> **Ảnh hưởng trực tiếp tới repo này:** `page.tsx` đang bọc `<Suspense>` ngay tại route (ví dụ `users/page.tsx`), nên body bắt đầu stream rất sớm → mọi `notFound()` bên dưới đều là **soft 404 với HTTP 200**. Với `apps/admin` (sau đăng nhập, không cần index) thì chấp nhận được. Với `apps/web` (trang công khai, cần SEO) thì **không**: nếu cần 404 thật, quyết định trong `proxy.ts` — nơi chạy trước khi response body bắt đầu.

| # | Rule |
|---|------|
| R7 | Cần **404 thật** (SEO/analytics/compliance) → kiểm tra tồn tại trong `proxy.ts`, hoặc gọi `notFound()` trước mọi `<Suspense>` và `await` có thể suspend |
| R8 | Không dựa vào status code của trang để phát hiện lỗi ở client — dùng `classifyError()` trên response của `webFetch` |
| R9 | Giữ kiểm tra trong `proxy.ts` **nhẹ** — không fetch nội dung đầy đủ ở đó |
| R10 | Dev hiện message gốc, production chỉ hiện message chung + `digest` — **không** viết UI phụ thuộc `error.message` |

### 18.4 Ai được phép thông báo lỗi

| Layer | Được làm | Không được làm |
|-------|----------|----------------|
| `api/*.api.ts` | Ném `ApiClientError` | Bắt lỗi, toast |
| `api/*.queries.ts` / `*.mutations.ts` | Trả `isError`, `error`; re-throw | Gọi `toast()` (ESLint `warn`) |
| `controllers/` | `classifyError()`, `toast()`, set state lỗi, quyết định tầng | Nuốt lỗi im lặng |
| `screens/` | Render `<ErrorState>` theo view model | Tự fetch để thử lại |
| `ui/` | Nhận `isError`/`onRetry` qua props | Biết `ApiClientError` là gì |

### ❌ DON'T

```ts
// WRONG 1: nuốt lỗi
try {
  await createUser(input);
} catch {
  // im lặng ← người dùng tưởng đã lưu thành công
}

// WRONG 2: đọc message thô của lỗi không rõ nguồn
toast.error(error.message); // ← có thể lộ nội dung nội bộ; dùng getErrorMessage(error, fallback)

// WRONG 3: tưởng error boundary bắt được lỗi click
<button onClick={() => { throw new Error("boom"); }} /> // ← không boundary nào bắt (R5)

// WRONG 4: dùng reset khi thật ra cần fetch lại
<button onClick={reset}>Thử lại</button> // ← chỉ render lại dữ liệu hỏng cũ; dùng unstable_retry (R4)

// WRONG 5: đoán tầng lỗi bằng status rải rác khắp component
if (err.status === 403) router.push("/login"); // ← 403 là permission, không phải auth — dùng classifyError()
```

---

## 19. FE Cache Rules

### Cấu hình nền

`QueryClient` đặt trong `components/providers.tsx`:

```ts
new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // console nội bộ: refetch mỗi lần focus gây nhiễu
      staleTime: 30_000,
    },
  },
});
```

### Rules

| # | Rule |
|---|------|
| R1 | Query key **bắt buộc** đi qua factory `model`/`api/*.query-keys.ts` — cấm viết mảng key thủ công tại chỗ gọi |
| R2 | Key phải chứa **mọi** biến ảnh hưởng tới kết quả (params, tenant/organization, locale). Thiếu một biến = hiển thị dữ liệu của ngữ cảnh khác |
| R3 | `staleTime` đặt theo **tốc độ thay đổi của dữ liệu**, không đặt bừa (bảng dưới) |
| R4 | Sau mutation: `invalidateQueries` với phạm vi **hẹp nhất** đúng đắn — không `invalidateQueries()` trần |
| R5 | Danh sách có phân trang dùng `placeholderData: (previous) => previous` để không nháy trắng khi đổi trang |
| R6 | **Xoá sạch cache khi đổi danh tính**: logout, đổi organization, refresh token thất bại → `queryClient.clear()` |
| R7 | Không cache dữ liệu nhạy cảm lâu hơn mức cần (token, mã OTP, dữ liệu một lần) — `gcTime: 0` |
| R8 | Cache là dữ liệu hiển thị, **không** phải nguồn sự thật cho quyết định phân quyền (§20 R1) |

| Loại dữ liệu | `staleTime` gợi ý | Ví dụ trong repo |
|--------------|-------------------|------------------|
| Gần như tĩnh | 5 phút | danh sách organizations |
| Dữ liệu vận hành | 30 giây (mặc định) | danh sách users, dashboard |
| Đang biến động | 0 | job đang chạy, tiến trình import |
| Nhạy cảm/một lần | 0 + `gcTime: 0` | MFA challenge |

### ✅ DO

```ts
// Key factory — một nguồn duy nhất, invalidate theo tầng
export const usersKeys = {
  all: ["users"] as const,
  lists: () => [...usersKeys.all, "list"] as const,
  list: (params: { listPath: string; sortKey: string }) =>
    [...usersKeys.lists(), params] as const,
  detail: (id: string) => [...usersKeys.all, "detail", id] as const,
};

// Invalidate hẹp: sửa 1 user thì không cần đập cả cache app
await queryClient.invalidateQueries({ queryKey: usersKeys.detail(userId) });
await queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
```

```ts
// Đổi danh tính → cache cũ không còn hợp lệ
export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      // Bắt buộc: nếu không, người đăng nhập tiếp theo trên cùng máy
      // sẽ thấy dữ liệu của người trước trong khoảnh khắc đầu.
      queryClient.clear();
    },
  });
}
```

### ❌ DON'T

```ts
// WRONG 1: key thủ công — không invalidate được, dễ gõ sai
useQuery({ queryKey: ["users", page], queryFn: ... }); // ← vi phạm R1

// WRONG 2: thiếu biến trong key — dữ liệu tenant lẫn nhau
queryKey: usersKeys.list({ page }), // ← thiếu organizationId (R2) — lỗi bảo mật, không chỉ là bug cache

// WRONG 3: đập toàn bộ cache sau mỗi mutation
await queryClient.invalidateQueries(); // ← vi phạm R4 — refetch cả những màn hình không liên quan

// WRONG 4: giữ cache qua ranh giới đăng nhập
onSuccess: () => router.push("/login"), // ← vi phạm R6 — cache của user cũ vẫn còn
```

---

## 20. FE Security Rules

> Chốt chặn bảo mật nằm ở BE. Mọi rule dưới đây nhằm **không mở thêm lỗ hổng ở FE** và không tạo cảm giác an toàn giả.

| # | Rule |
|---|------|
| R1 | Permission ở FE chỉ để **ẩn/hiện UI**. Mỗi endpoint phải tự kiểm tra quyền ở BE (§11.1). Ẩn nút không phải là bảo vệ |
| R2 | Kiểm tra quyền qua selector ở `model/*.permissions.ts` — không rải `permissions.includes("...")` khắp component |
| R3 | Mọi request đi qua `webFetch` — nó tự gắn `x-csrf-token` và `credentials: "same-origin"`. **Cấm** gọi `fetch()` trần tới BFF |
| R4 | Token/refresh token nằm trong cookie `httpOnly` do BFF quản lý. **Cấm** lưu token vào `localStorage`/`sessionStorage` |
| R5 | Mọi param điều hướng (`returnTo`, `redirect`, `next`, `callbackUrl`) phải qua `internalPath()` — chống open redirect |
| R6 | `dangerouslySetInnerHTML` chỉ dùng cho **hằng số build-time** (ví dụ theme init script). **Cấm tuyệt đối** với dữ liệu từ API hoặc URL |
| R7 | Chỉ đặt vào `NEXT_PUBLIC_*` những gì chấp nhận công khai — biến này nằm trong bundle, ai cũng đọc được |
| R8 | Không log token, cookie, PII ra `console` ở production. Lỗi hiển thị dùng `getErrorMessage()`, chi tiết dùng `digest` |
| R9 | Kiểm tra ở `proxy.ts` là **pre-filter UX**, không phải chốt chặn — session/RBAC thật vẫn được xác thực lại ở BFF/BE |
| R10 | Xoá cache khi đổi danh tính (§19 R6) — dữ liệu người dùng cũ không được rò sang phiên mới |

### ✅ DO

```ts
// R5 — return param được kiểm tra trước khi thành href
// apps/admin/src/features/users/controllers/use-user-detail-controller.ts
const backHref = internalPath(searchParams.get("returnTo"), "/users");
```

```ts
// R2 — quyền tập trung một chỗ, component chỉ nhận boolean
export function selectUserManagementPermissions(permissions: readonly string[] | undefined) {
  const granted = new Set(permissions ?? []);
  return {
    canCreate: granted.has("users.create"),
    canUpdate: granted.has("users.update"),
    canDelete: granted.has("users.delete"),
  };
}
```

### ❌ DON'T

```ts
// WRONG 1: open redirect — biến nút "quay lại" thành cửa dẫn ra ngoài
const backHref = searchParams.get("returnTo") ?? "/users";
// ?returnTo=https://evil.com  hoặc  ?returnTo=//evil.com  → vi phạm R5

// WRONG 2: render HTML từ server
<div dangerouslySetInnerHTML={{ __html: user.bio }} /> // ← vi phạm R6, XSS

// WRONG 3: tự fetch, mất CSRF token
await fetch("/api/bff/admin/users", { method: "POST", body }); // ← vi phạm R3

// WRONG 4: coi việc ẩn nút là phân quyền
{canDelete && <DeleteButton />}
// ← đúng về UX, nhưng nếu BE không kiểm tra thì vẫn xoá được bằng curl (R1)

// WRONG 5: secret lọt vào bundle
NEXT_PUBLIC_API_SECRET=... // ← vi phạm R7
```

---

## 21. FE Performance Rules

| # | Rule |
|---|------|
| R1 | Server Component là mặc định. `"use client"` đẩy xuống **lá** gần nhất cần tương tác — không đặt ở layout/page rồi kéo cả cây sang client |
| R2 | Bọc `<Suspense>` quanh phần chậm để phần còn lại hiển thị ngay — nhưng nhớ hệ quả status code ở §18.3 |
| R3 | Ô tìm kiếm/lọc phải debounce trước khi vào query (repo dùng `useDebouncedValue(value, 500)`) |
| R4 | Danh sách phân trang dùng `placeholderData: (previous) => previous` — giữ dữ liệu cũ thay vì skeleton nhấp nháy |
| R5 | Repo đã bật **React Compiler** — **không** thêm `useMemo`/`useCallback` thủ công trừ khi đo được lợi ích, hoặc khi lint báo thư viện không memo hoá được (ví dụ `useReactTable`) |
| R6 | Query độc lập chạy **song song**; cấm `await` tuần tự tạo waterfall |
| R7 | Component nặng và ít dùng (drawer, dialog, editor, chart) → `next/dynamic` với `ssr: false` khi phù hợp |
| R8 | Ảnh dùng `next/image`; không nhúng ảnh lớn dạng base64 vào bundle |
| R9 | Không import cả barrel nặng chỉ để lấy một thứ — import đúng entry (`@repo/web-ui/button`, không phải `@repo/web-ui`) |
| R10 | `select` của React Query để thu hẹp dữ liệu re-render, thay vì lọc lại trong component mỗi lần render |

### ✅ DO

```ts
// R3 + R4 — gõ nhiều nhưng chỉ gọi API khi ngừng gõ, và không nháy trắng khi đổi trang
const debouncedSearch = useDebouncedValue(searchInput, 500);
const users = useUsersListQuery({ ...listParams, search: debouncedSearch });
// useUsersListQuery: placeholderData: (previous) => previous
```

```ts
// R6 — ba nguồn độc lập, chạy song song
const user = useAdminUserQuery(userId);
const roles = useAdminRolesQuery();
const organizations = useMyOrganizationsQuery();
```

### ❌ DON'T

```tsx
// WRONG 1: "use client" ở đỉnh cây — kéo toàn bộ page sang client
"use client";
export default function Page() { /* ← vi phạm R1 */ }

// WRONG 2: waterfall
const user = await fetchUser(id);
const roles = await fetchRoles();      // ← không phụ thuộc user, đáng lẽ chạy song song (R6)

// WRONG 3: gọi API mỗi ký tự
onChange={(e) => setSearch(e.target.value)} // rồi dùng thẳng search làm query key ← vi phạm R3

// WRONG 4: memo hoá thủ công tràn lan khi đã có React Compiler
const cols = useMemo(() => buildColumns(), []); // ← vi phạm R5, thêm nhiễu không đo được lợi ích

// WRONG 5: import barrel nặng trong route
import { Button } from "@repo/web-ui"; // ← vi phạm R9 — dùng "@repo/web-ui/button"
```

---

## 22. API Contract & Client Generation

> **Một nguồn sự thật cho mọi client.** Endpoint, request/response shape, và enum sống trong OpenAPI — không copy tay sang admin / web / Flutter.

### Pipeline (bắt buộc)

```
Nest controllers + DTOs + decorators
  → apps/api/openapi.json                 # JSON contract (committed)
  → pnpm generate
       ├─ packages/api-contract           # TS types + paths (openapi-typescript)
       └─ apps/mobile/lib/generated/api   # Dart Dio client (openapi-generator)
```

| Client | Dùng contract thế nào |
|--------|------------------------|
| **admin / web** | Types từ `@repo/api-contract` / `@/lib/api-types`; URL qua `bffPath("/api/v1/...")` |
| **Flutter** | Client generate sẵn — **không** tự ghép URL string song song |

### Rules

| # | Rule |
|---|------|
| R1 | OpenAPI (`apps/api/openapi.json`) là **single source of truth** cho HTTP API. Không duy trì file JSON/YAML endpoint thứ hai |
| R2 | Đổi controller/DTO/decorator → chạy `pnpm generate` và **commit** `openapi.json` + generated TS (+ Dart khi không skip). **Cấm** hand-edit `packages/api-contract/src/generated/` hay Dart generated như nguồn chính |
| R3 | `*.api.ts` (web/admin): path lấy từ key OpenAPI qua `bffPath(...)` — **cấm** string URL tự nghĩ (`"/api/bff/admin/foo"`) khi path đã có trong contract |
| R4 | Mapping BFF cố định: `/api/v1/<rest>` → `/api/bff/<rest>`. Không thêm prefix `admin/` ở FE nếu BE không khai báo trong OpenAPI |
| R5 | Response/request types import từ contract (`components["schemas"][...]` qua `@/lib/api-types`) — không định nghĩa DTO trùng song song ở FE |
| R6 | Flutter dùng generated client; không hardcode path/DTO lệch OpenAPI |
| R7 | Nếu generate fail (DB/boot): **không** coi patch tay `openapi.json` là chuẩn lâu dài — unblock generate rồi regen. Patch tạm phải khớp Nest source và ghi rõ trong commit |
| R8 | Endpoint mới cho admin **và** mobile phải xuất hiện trong OpenAPI trước khi FE/mobile gọi |

### ✅ DO

```ts
import { bffPath } from "@repo/api-contract";
import { buildPath, webFetch } from "@/lib/http";

// Key phải là keyof paths — typo / path không tồn tại → lỗi typecheck
export const filesApi = {
  list(params: { page: number; search?: string }) {
    return webFetch(
      buildPath(bffPath("/api/v1/files"), {
        page: params.page,
        search: params.search,
      }),
    );
  },
  getDownloadUrl(fileId: string) {
    return webFetch(bffPath("/api/v1/files/{id}/url", { id: fileId }));
  },
};
```

```bash
# Sau khi sửa Nest presentation
pnpm generate
# commit: openapi.json + packages/api-contract + mobile generated (nếu có)
```

### ❌ DON'T

```ts
// WRONG 1: đoán path — lệch OpenAPI (files thật là /api/v1/files, không phải admin/files)
webFetch("/api/bff/admin/files"); // ← vi phạm R3/R4

// WRONG 2: DTO tự viết song song với contract
interface FileDto { id: string; storageKey: string } // ← vi phạm R5; storageKey có thể đã bị ẩn khỏi public schema

// WRONG 3: sửa tay generated rồi coi là xong
// packages/api-contract/src/generated/index.ts  ← vi phạm R2

// WRONG 4: Flutter gọi URL raw trong khi đã có generated client
dio.get("/api/v1/files"); // ← vi phạm R6
```

### ⚠️ NOTE — Tech debt hiện tại

Nhiều `features/*/api/*.api.ts` vẫn còn literal `"/api/bff/..."`. Đó là **nợ migrate** sang `bffPath` + contract keys — code mới / chỗ đang đụng phải chuyển; không mở rộng thêm string path tự do.
