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
│   ├── api-identity/ # Bounded Context: auth, users, organizations
│   ├── api-platform/ # Bounded Context: files, notifications, audit, exports
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
import { http } from "@/lib/http";
import type { UserListResponse, CreateUserInput } from "@repo/api-contract";

// Fetch functions thuần — không có hooks, không có state
export const usersApi = {
  list: (params: UsersListParams): Promise<UserListResponse> =>
    http.get("/users", { params }),
  get: (id: string): Promise<User> =>
    http.get(`/users/${id}`),
  create: (data: CreateUserInput): Promise<User> =>
    http.post("/users", data),
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
// packages/api-identity/src/modules/auth/presentation/auth.controller.ts
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
// packages/api-identity/src/modules/auth/application/use-cases/login.use-case.ts
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
// packages/api-identity/src/modules/users/domain/user.entity.ts

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
// packages/api-identity/src/modules/auth/application/ports/auth-session.repository.port.ts
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
  ├── drizzle-<resource>.repository.ts  # Drizzle implementation
  └── <service>.adapter.ts              # External service adapter
```

| # | Rule |
|---|------|
| R1 | Implement Port interface (`implements <Resource>RepositoryPort`) |
| R2 | Drizzle queries chỉ ở đây — **không** ở Use Case hay Domain |
| R3 | **Không** chứa business logic — chỉ data access logic |
| R4 | **Không** throw domain errors — throw infrastructure errors; Use Case translate |
| R5 | Đăng ký vào NestJS module với injection token từ Port |

✅ **DO**
```ts
// packages/api-identity/src/modules/users/infrastructure/drizzle-users.repository.ts
@Injectable()
export class DrizzleUsersRepository implements UsersRepositoryPort {
  constructor(private readonly db: DatabaseService) {}

  // Infrastructure chứa raw Drizzle query — không business logic
  async findByEmail(email: string): Promise<UserRecord | null> {
    const result = await this.db.query.users.findFirst({
      where: eq(usersTable.email, email),
    });
    return result ?? null;
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

### 11.6 DI Wiring (apps/api/src/shell/)

- Module wiring thuộc về `shell/` — không hardcode dependency trong Use Case
- Mỗi Bounded Context có NestJS Module riêng (VD: `AuthModule`, `UsersModule`)
- Infrastructure providers đăng ký với token từ Port:
  ```ts
  { provide: USERS_REPOSITORY, useClass: DrizzleUsersRepository }
  ```

---

## 12. DB & External Service Rules

### 12.1 Port-First Pattern

> **Mọi** truy cập DB và external service phải có Port interface trước khi có implementation.

**Lý do:** Testability (mock Port trong unit test), swappability (đổi implementation mà không ảnh hưởng business logic), clear contracts.

✅ **DO**
```
1. Tạo interface: modules/<domain>/application/ports/<resource>.repository.port.ts
2. Tạo implementation: modules/<domain>/infrastructure/drizzle-<resource>.repository.ts
3. Đăng ký DI trong Module
```

❌ **DON'T**
```ts
// WRONG: Use Case inject concrete implementation trực tiếp
constructor(private readonly repo: DrizzleUsersRepository) {} // ← inject Port, không phải implementation
```

---

### 12.2 No Raw Queries Outside Infrastructure

> Drizzle queries (`db.select()`, `db.insert()`, `db.update()`, `db.delete()`) chỉ được phép trong `infrastructure/` layer.

🔒 **SECURITY:** Drizzle schema (table definitions) **không được import** ra ngoài Infrastructure — schema là internal detail của infrastructure.

✅ **DO:** Tất cả raw queries trong `drizzle-*.repository.ts`

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
| Repository | `drizzle-<resource>.repository.ts` | `Drizzle<Resource>Repository` | `DrizzleUsersRepository` |
| Adapter | `<service>.adapter.ts` | `<Service>Adapter` | `ResendEmailAdapter` |
