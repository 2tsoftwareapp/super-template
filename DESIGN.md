Vấn đề của repo hiện tại **không phải thiếu layer**, mà là:

> Có nhiều layer nhưng **chưa có một bộ quy tắc kiến trúc duy nhất, đủ chi tiết và được kiểm tra tự động (enforce)**.

Khi nhiều AI cùng làm việc, mỗi AI tự suy diễn:

* "Service" là nơi chứa business logic hay chỉ là lớp chuyển tiếp (facade)?
* Có cần Use Case không?
* Repository interface nằm ở đâu?
* UI component có được gọi query không?
* `View` là presentational hay page controller?
* Form state, URL state, permissions, toast đặt ở đâu?
* Feature nhỏ có được bỏ layer không?

Hậu quả là tên folder có vẻ sạch, nhưng mở code ra vẫn khó đọc.

# 1. Những bất nhất hiện có trong repo

## Backend: tài liệu nói một kiểu, generator nói một kiểu

Root `AGENTS.md` yêu cầu đi theo:

```text
presentation → application → infrastructure
```

Nhưng skill `add-api-feature` lại sinh:

```text
application/
  <feature>.service.ts
  <feature>.mapper.ts
  <feature>.repository.port.ts
```

Trong đó mapper và repository port được ghi là optional. Skill này còn hướng frontend tới `apps/admin/src/pages/...`, trong khi repo đang dùng Next.js App Router.

Nghĩa là chính instruction dành cho AI đã lỗi thời. AI làm theo skill sẽ tạo ra kiến trúc khác với code hiện tại.

## Backend tồn tại layer facade gần như không có giá trị

Ví dụ `AuthService` chứa nhiều method nhưng hầu hết chỉ gọi tiếp:

```ts
register(input, context) {
  return this.registerUseCase.execute(input, context);
}
```

`SettingsService` cũng có cấu trúc tương tự.

Luồng hiện tại:

```text
Controller
  → AuthService
    → RegisterUseCase
      → Repository
```

Trong khi `AuthService` không làm orchestration, không transaction, không policy và không mapping. Nó chỉ là một lớp chuyển tiếp.

Điều này gây ra câu hỏi cho AI:

* Feature mới dùng service hay use case?
* Service chứa logic hay chỉ gọi use case?
* Feature nhỏ có cần cả hai không?
* Controller được inject use case trực tiếp không?

Nếu không chốt rõ, mỗi module sẽ một kiểu.

## Frontend: nhãn “presentational” nhưng thực tế view vẫn là controller lớn

`UsersView` hiện đang trực tiếp xử lý:

* Router và pathname
* URL search params
* Parse/serialize filter
* Debounce search
* React Query
* Mutation
* Permission checks
* Table state
* Sorting state
* Selection state
* Dialog state
* Callback orchestration
* JSX rendering

File đã dài hơn 260 dòng và chưa kết thúc ở phần được đọc.

Đây không phải presentational view. Đây là:

```text
Page controller
+ URL state manager
+ Permission resolver
+ Table controller
+ Dialog controller
+ UI renderer
```

gộp trong một file.

## Frontend documentation đã từng thay đổi pattern

Spec cũ nói:

```text
features/<resource>/      business logic
app/(app)/<resource>/     view, drawer, columns
```

Nhưng convention hiện tại yêu cầu view, drawer, table columns nằm trong:

```text
features/<resource>/components/
```

Pattern mới hợp lý hơn, nhưng spec cũ vẫn tồn tại và được đánh dấu “implemented”. AI tìm context có thể đọc cả hai rồi chọn ngẫu nhiên.

---

# 2. Nguyên tắc cần chốt

Bốn nguyên tắc sau:

## Một luồng duy nhất

Mọi feature backend phải đi theo cùng một dependency direction:

```text
Presentation
    ↓
Application
    ↓
Domain
    ↓
Application Ports
    ↓
Infrastructure
```

Frontend cũng phải có một luồng duy nhất:

```text
Route
  ↓
Screen
  ↓
Controller Hook
  ↓
Queries / Mutations
  ↓
API functions
```

UI nhận data và callback, không tự đi lấy data.

## Mỗi folder phải trả lời một câu hỏi

| Folder                 | Câu hỏi                                |
| ---------------------- | ------------------------------------------ |
| `presentation`         | Hệ thống giao tiếp với bên ngoài thế nào?  |
| `application`          | Use case của hệ thống làm gì?              |
| `domain`               | Luật nghiệp vụ là gì?                      |
| `infrastructure`       | Database/provider được triển khai thế nào? |
| frontend `api`         | Gọi backend thế nào?                       |
| frontend `model`       | Dữ liệu, schema và state thuần là gì?      |
| frontend `controllers` | Màn hình phối hợp các hành vi thế nào?     |
| frontend `ui`          | Màn hình hiển thị thế nào?                 |

## Không tạo layer chỉ để chuyển tiếp

Một class chỉ gọi class khác với cùng tham số và cùng kết quả thường không tạo thêm giá trị.

## Convention phải được thực thi (enforce)

Documentation không đủ. AI vẫn có thể bỏ qua hoặc hiểu sai.

Phải thực thi bằng:

* ESLint.
* Source policy scripts.
* Turborepo boundaries.
* Scaffolding generator.
* Architecture tests.
* Golden reference module.

---

# 3. Backend architecture đề xuất

## 3.1 Cấu trúc bounded context

```text
packages/api-identity/
└── src/
    ├── identity.module.ts
    └── modules/
        ├── auth/
        ├── users/
        ├── organizations/
        ├── access-control/
        └── mfa/
```

`api-identity` và `api-platform` là bounded context.

Không đưa domain feature vào `apps/api`.

```text
apps/api/
├── main.ts
├── app.module.ts
└── cli/
```

`apps/api` chỉ là composition root:

* Khởi động Nest.
* Import bounded contexts.
* Global pipes/filters/interceptors.
* Swagger.
* CLI migration/seed bootstrap.

Repo hiện đã đi đúng hướng ở điểm này.

---

## 3.2 Cấu trúc backend module chuẩn

```text
modules/users/
├── users.module.ts
│
├── presentation/
│   ├── admin-users.controller.ts
│   ├── current-user.controller.ts
│   ├── dto/
│   │   ├── create-user.dto.ts
│   │   ├── update-user.dto.ts
│   │   ├── user-response.dto.ts
│   │   └── list-users-query.dto.ts
│   └── mappers/
│       └── user-response.mapper.ts
│
├── application/
│   ├── use-cases/
│   │   ├── create-user.use-case.ts
│   │   ├── get-user.use-case.ts
│   │   ├── list-users.use-case.ts
│   │   ├── update-user.use-case.ts
│   │   └── block-user.use-case.ts
│   ├── ports/
│   │   ├── user.repository.port.ts
│   │   └── user-avatar-storage.port.ts
│   ├── models/
│   │   ├── user-result.ts
│   │   └── user-list-result.ts
│   └── errors/
│       └── user.errors.ts
│
├── domain/
│   ├── user-status.ts
│   ├── user-policy.ts
│   ├── user-policy.spec.ts
│   └── user.entity.ts
│
└── infrastructure/
    ├── persistence/
    │   ├── drizzle-user.repository.ts
    │   └── user.persistence-mapper.ts
    └── storage/
        └── s3-user-avatar.storage.ts
```

Không phải module nào cũng bắt buộc có đủ tất cả file, nhưng **vị trí của từng loại code là cố định**.

---

# 4. Backend: trách nhiệm từng layer

## Presentation

Chỉ xử lý giao thức HTTP:

* Decorator
* Route
* Authentication context
* Parse path/query/body
* Gọi use case
* Map application result thành response DTO
* Chọn HTTP status

Không được:

* Import Drizzle
* Query database
* Chứa business condition
* Gọi repository
* Gửi mail trực tiếp
* Tạo transaction
* Import infrastructure

Ví dụ:

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

Controller **inject use case trực tiếp**.

---

## Application

Application layer mô tả hành vi của hệ thống:

* Create user.
* Block user.
* Send notification.
* Upload file version.
* Accept organization invitation.

Use case chịu trách nhiệm:

* Orchestration
* Transaction boundary
* Gọi domain policies
* Gọi repository ports
* Gọi cross-context ports
* Audit side effects
* Trả application result

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
      await this.audit.write(/* ... */);

      return toUserResult(updated);
    });
  }
}
```

Application không được import:

* Controller DTO
* Express request
* `@nestjs/swagger`
* Drizzle table
* Concrete S3/Redis client

Nest `@Injectable()` được chấp nhận vì repo dùng Nest làm DI framework, nhưng business rule thuần phải nằm trong domain.

---

## Domain

Repo đã có ADR khá hợp lý:

> Chỉ tạo `domain/` khi module thực sự sở hữu state machine, validation policy hoặc authorization rule độc lập với framework.

Nên giữ nguyên quyết định này.

Ví dụ phù hợp có domain:

```ts
export function resolveJobFailure(
  job: JobState,
  now: Date,
): JobFailureOutcome {
  if (job.attempts >= job.maxAttempts) {
    return { status: "FAILED", retryAt: null };
  }

  return {
    status: "PENDING",
    retryAt: new Date(now.getTime() + retryDelay(job.attempts)),
  };
}
```

Không cần domain cho CRUD đơn giản:

```text
GET settings
PATCH settings/:key
```

Không có domain không đồng nghĩa được bỏ qua application/ports.

---

## Application ports

Repository interface phải nằm ở phía consumer, không nằm cạnh implementation:


```ts
export const USER_REPOSITORY = Symbol("USER_REPOSITORY");

export interface UserRepositoryPort {
  findById(id: string): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  create(input: CreateUserRecord): Promise<UserRecord>;
  updateStatus(id: string, status: UserStatus): Promise<UserRecord>;
}
```

Application phụ thuộc interface này.

Infrastructure triển khai interface:

```ts
@Injectable()
export class DrizzleUserRepository implements UserRepositoryPort {
  constructor(private readonly database: DatabaseService) {}

  findById(id: string) {
    // Drizzle implementation
  }
}
```

Binding chỉ xuất hiện trong module:

```ts
{
  provide: USER_REPOSITORY,
  useClass: DrizzleUserRepository,
}
```

---

## Infrastructure

Chỉ chứa chi tiết kỹ thuật:

* Drizzle
* PostgreSQL
* Redis
* S3
* SMTP
* Firebase
* External HTTP provider
* Cryptographic provider implementation

Không được chứa business rule kiểu:

```ts
if (user.role === "SUPER_ADMIN") ...
```

Infrastructure chỉ thực hiện contract của port.

---

# 5. Có giữ `<Feature>Service` hay không?

Đề xuất:

## Xóa facade service chuyển tiếp

Không dùng:

```text
Controller
  → AuthService
    → LoginUseCase
```

Dùng:

```text
Controller
  → LoginUseCase
```

`AuthService` hiện tại chủ yếu là pass-through.

## Chỉ tạo facade khi có consumer ngoài module

Ví dụ: module khác cần một API ổn định từ Identity:

```ts
export interface UserLookupPort {
  findUserSummary(userId: string): Promise<UserSummary | null>;
}
```

Hoặc:

```ts
@Injectable()
export class IdentityFacade {
  findUserSummary(id: string) {
    // Deliberate public API for other contexts
  }
}
```

Facade này có mục đích:

* Là public API của bounded context
* Che giấu internal use cases
* Không phục vụ controller trong cùng module
* Chỉ export những operation context khác được phép dùng

Như vậy tên `Service` không còn mơ hồ.

---

# 6. Backend naming convention

## Class

```text
CreateUserUseCase
ListUsersUseCase
BlockUserUseCase

UserRepositoryPort
DrizzleUserRepository

UserResponseMapper
UserPersistenceMapper

UserPolicy
UserErrors
```

## File

```text
create-user.use-case.ts
user.repository.port.ts
drizzle-user.repository.ts
user-response.mapper.ts
user-persistence.mapper.ts
```

## Input/output

Không dùng DTO của controller làm input use case:


```ts
// Presentation
CreateUserDto

// Application
CreateUserCommand
CreateUserResult
```

Lý do:

* HTTP DTO có decorator validation/Swagger
* Command là contract nội bộ
* Use case sau này có thể được gọi từ job, CLI hoặc event mà không phụ thuộc HTTP

---

# 7. Frontend architecture đề xuất

Backend layer không thể áp dụng nguyên sang frontend. Frontend có các vấn đề khác:

* Server state
* URL state
* Local UI state
* Form state
* Permission
* Navigation
* Rendering

Cấu trúc nên là vertical slice theo feature.

```text
apps/admin/src/
├── app/
│   └── [locale]/
│       └── (app)/
│           └── users/
│               ├── page.tsx
│               └── [id]/
│                   └── page.tsx
│
├── features/
│   └── users/
│       ├── api/
│       │   ├── users.api.ts
│       │   ├── users.query-keys.ts
│       │   ├── users.queries.ts
│       │   └── users.mutations.ts
│       │
│       ├── model/
│       │   ├── users.types.ts
│       │   ├── users.schemas.ts
│       │   ├── users.search-params.ts
│       │   ├── users.sorting.ts
│       │   └── users.permissions.ts
│       │
│       ├── controllers/
│       │   ├── use-users-list-controller.ts
│       │   └── use-user-detail-controller.ts
│       │
│       ├── screens/
│       │   ├── users-list-screen.tsx
│       │   └── user-detail-screen.tsx
│       │
│       ├── ui/
│       │   ├── users-list-view.tsx
│       │   ├── users-table.tsx
│       │   ├── users-toolbar.tsx
│       │   ├── create-user-drawer.tsx
│       │   └── block-user-dialog.tsx
│       │
│       └── index.ts
│
├── components/
│   ├── admin-shell/
│   ├── resource-table/
│   └── guards/
│
└── lib/
    ├── http/
    ├── auth/
    └── routing/
```

---

# 8. Frontend: luồng một page

```text
page.tsx
  ↓
UsersListScreen
  ↓
useUsersListController
  ├── URL state
  ├── permission selectors
  ├── useUsersListQuery
  ├── mutations
  ├── selection state
  └── event handlers
  ↓
UsersListView
  ├── UsersToolbar
  ├── UsersTable
  ├── Pagination
  └── Dialogs
```

## Route

Route chỉ làm nhiệm vụ routing:

```tsx
import { UsersListScreen } from "@/features/users";

export default function UsersPage() {
  return <UsersListScreen />;
}
```

Không `"use client"` nếu không cần.

Không import:

* React Query.
* `webFetch`.
* Form schema.
* Feature API.

---

## Screen

Screen kết nối controller với UI:


```tsx
"use client";

export function UsersListScreen() {
  const controller = useUsersListController();

  return <UsersListView {...controller.viewProps} />;
}
```

Screen không nên chứa hàng trăm dòng JSX và callback.

---

## Controller hook

Đây là layer repo đang thiếu rõ nhất hiện nay.

```ts
export function useUsersListController() {
  const urlState = useUsersListUrlState();
  const session = useAdminSession();

  const usersQuery = useUsersListQuery(urlState.queryParams);
  const activateMutation = useActivateUsersMutation();
  const blockMutation = useBlockUsersMutation();

  const permissions = selectUserManagementPermissions(session);

  const handleActivate = async (userId: string) => {
    await activateMutation.mutateAsync({ userIds: [userId] });
  };

  return {
    viewProps: {
      users: usersQuery.data?.data ?? [],
      isLoading: usersQuery.isLoading,
      error: usersQuery.error,
      canCreate: permissions.canCreate,
      canUpdate: permissions.canUpdate,
      search: urlState.search,
      onSearchChange: urlState.setSearch,
      onActivate: handleActivate,
      onBlock: blockMutation.mutate,
    },
  };
}
```

Controller được phép:

* Gọi React Query hooks
* Đọc router và search params
* Đọc session
* Điều phối mutations
* Quản lý local state
* Tạo callbacks
* Map server data sang view model

Controller không nên:

* Chứa JSX
* Tự gọi `webFetch`
* Định nghĩa Zod schema
* Chứa generic reusable UI logic

Nếu controller vượt khoảng 200 dòng, tách theo concern:

```text
use-users-list-url-state.ts
use-users-list-selection.ts
use-users-list-actions.ts
use-users-list-controller.ts
```

Controller chính chỉ tổ hợp (compose) các hook nhỏ.

---

## API functions

Tên file nên là `*.api.ts`, không gọi là `service`, để tránh nhầm với backend service.


```ts
export const usersApi = {
  list(params: UsersListParams) {
    return webFetch<ListUsersResponse>(
      buildUsersListPath(params),
    );
  },

  block(userIds: string[]) {
    return webFetch("/api/admin/users/block", {
      method: "POST",
      body: { userIds },
    });
  },
};
```

Luật cứng:

> Chỉ file trong `features/*/api/*.api.ts` và shared HTTP infrastructure mới được import `webFetch`.

Hiện tại `use-users-queries.ts` gọi `webFetch` trực tiếp.

Nên đổi thành:


```ts
queryFn: () => usersApi.list(params)
```

Nhờ đó:

* API URL nằm một chỗ
* Query hook chỉ quản lý cache
* API function test không cần React
* Có thể tái sử dụng API function ngoài React Query

---

## Query keys

Không nên dùng hằng số (constant) đơn lẻ:


```ts
USERS_QUERY_KEY
```

Nên dùng key factory:

```ts
export const usersKeys = {
  all: ["users"] as const,

  lists: () =>
    [...usersKeys.all, "list"] as const,

  list: (params: UsersListParams) =>
    [...usersKeys.lists(), normalizeUsersParams(params)] as const,

  details: () =>
    [...usersKeys.all, "detail"] as const,

  detail: (id: string) =>
    [...usersKeys.details(), id] as const,
};
```

Invalidation trở nên rõ ràng:

```ts
queryClient.invalidateQueries({
  queryKey: usersKeys.lists(),
});
```

---

## Queries và mutations

Queries chỉ chịu trách nhiệm:

* Query key
* Query function
* Cache policy
* Placeholder data
* Enable condition


```ts
export function useUsersListQuery(params: UsersListParams) {
  return useQuery({
    queryKey: usersKeys.list(params),
    queryFn: () => usersApi.list(params),
    placeholderData: keepPreviousData,
  });
}
```

Mutations chịu trách nhiệm:

* Mutation function
* Cache invalidation
* Optimistic update nếu có

Không nên hard-code toast message trong mutation hook nếu cùng mutation được dùng ở nhiều UX khác nhau.

Có thể trả error/success lên controller để controller quyết định toast phù hợp với màn hình.

---

## Model

`model/` chỉ chứa code thuần (pure logic):

* Types
* Zod schemas
* Search params
* Sort mapping
* Permission selectors
* Formatters đặc thù feature
* State reducers

Không React Query, không JSX, không HTTP.


Ví dụ:

```ts
export function selectUserManagementPermissions(
  session: AdminSession,
): UserManagementPermissions {
  const permissions = new Set(session.permissions);

  return {
    canCreate: permissions.has("users.create"),
    canUpdate: permissions.has("users.update"),
    canDelete: permissions.has("users.delete"),
  };
}
```

UI không nên tự viết:

```ts
permissions.includes("users.update")
```

ở nhiều component.

---

## UI components

UI phải nhận props:

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

UI được phép:

* Local visual state đơn giản (open/closed)
* Render conditional
* Compose primitives
* Call callback

UI không được:

* Gọi API
* Gọi React Query
* Đọc session
* Đọc search params
* Tự kiểm tra permission strings
* Tự điều hướng business flow
* Invalidate query

---

# 9. Phân loại state frontend

Để AI không nhồi nhét mọi state vào `useState`, cần chốt rõ:


| Loại state                     | Nơi đặt                          |
| ------------------------------ | -------------------------------- |
| Server data                    | TanStack Query                   |
| Filter/sort/page cần share URL | URL search params                |
| Form values                    | React Hook Form                  |
| Validation                     | Zod                              |
| Drawer/dialog đang mở          | Local component/controller state |
| Session                        | Auth/session provider            |
| Permission-derived state       | Pure selector                    |
| Cross-page client state        | Store, chỉ khi thực sự cần       |
| Theme/locale                   | Dedicated provider               |

Ví dụ users page:

```text
search       → URL
status       → URL
page         → URL
sort         → URL
users data   → React Query
rowSelection → local controller state
createOpen   → local controller state
form values  → React Hook Form
permissions  → derived from session
```

---

# 10. Import boundary frontend

Cần enforce:


```text
app
  → features
  → shared components/lib

features/users
  ├─ may import shared
  └─ must not import features/roles internal files
```

Cross-feature interaction chỉ qua:

1. Public feature entry:

```ts
import { rolesKeys } from "@/features/roles";
```

2. Shared abstraction

3. App-level orchestration

Không import sâu (deep import):


```ts
import { something } from "@/features/roles/api/internal-file";
```

Mỗi feature có `index.ts` với public exports có chủ đích.

---

# 11. Giới hạn kích thước và độ phức tạp

Không nên coi LOC (lines of code) là luật tuyệt đối, nhưng cần warning threshold để AI tự dừng lại.


| Loại file                |     Warning |
| ------------------------ | ----------: |
| Controller               |   >150 dòng |
| Use case                 |   >200 dòng |
| React controller hook    |   >200 dòng |
| View/component           |   >200 dòng |
| Function                 | >40–60 dòng |
| Constructor dependencies |          >7 |
| Component props          |      >12–15 |

Khi vượt ngưỡng, AI phải giải thích lý do hoặc tách nhỏ.

Ví dụ `UsersView` hiện vi phạm ở đúng điểm này — quá nhiều responsibility trong một component.

---

# 12. Làm sao để tất cả AI code cùng một kiểu

## Chỉ có một source of truth


Tạo:

```text
docs/architecture/
├── backend-conventions.md
├── frontend-conventions.md
├── testing-conventions.md
├── naming-conventions.md
└── examples/
```

Root `AGENTS.md`, `CLAUDE.md`, `.agents/skills` chỉ link tới đây.

Không copy convention thành nhiều bản.

Hiện repo có ít nhất các bản sao:


* `AGENTS.md`
* `apps/admin/AGENTS.md`
* `.agents/skills/add-api-feature/SKILL.md`
* `.claude/skills/add-api-feature/SKILL.md`
* Các rearchitecture specs

Đây là nguồn gây drift.

## Xóa hoặc archive instruction lỗi thời

Đặc biệt skill `add-api-feature` phải được viết lại vì còn tạo Admin page theo `src/pages`, không phù hợp với repo hiện tại.

## Tạo hai golden feature (feature mẫu)

### Backend reference

Chọn một feature vừa đủ phức tạp, ví dụ `users`, viết chuẩn hoàn chỉnh:


```text
controller
use cases
ports
domain policy
repository
mappers
unit tests
integration tests
```

### Frontend reference

Viết lại users list theo:

```text
api
queries
model
controller
screen
ui
```

Sau đó ghi rõ:

> Mọi feature mới phải mirror `users`.

AI không còn tự phát minh pattern nữa.

## Tạo generator (scaffold)

```bash
pnpm scaffold:api-feature invoices
pnpm scaffold:admin-feature invoices
```

Generator sinh đúng:

* Folder
* Naming
* Test files
* Query key factory
* API client
* Controller
* Use case
* Port
* Repository
* Module binding

AI chủ yếu điền nghiệp vụ, không tự thiết kế structure.

## Enforce qua ESLint/source policy

Ví dụ:

* `presentation/**` không import `infrastructure/**`
* `domain/**` không import Nest, Drizzle, Express
* `application/**` không import `presentation/**`
* `app/**` không import React Query hay HTTP
* `ui/**` không import React Query, router, HTTP, session
* `api/**` không import React
* `model/**` không import HTTP hoặc React
* `features/**` không deep-import feature khác

## CI grep checks

Có thể thêm các kiểm tra đơn giản nhưng hiệu quả:


```bash
rg "webFetch" apps/admin/src \
  -g '!features/**/api/*.api.ts' \
  -g '!lib/http/**'
```

```bash
rg "useQuery|useMutation" apps/admin/src/features/**/ui
```

```bash
rg "@repo/api-database|drizzle-orm" \
  packages/api-*/src/modules/**/application
```

---

# 13. Quyết định kiến trúc đề xuất


## Backend

```text
Controller
  → UseCase
    → Domain policy/entity
    → Application port
      → Infrastructure implementation
```

* Không generic facade service chuyển tiếp
* Có domain khi thực sự có rule
* DTO không đi vào application
* Repository interface luôn nằm trong application ports
* Database record không leak ra controller
* Cross-context chỉ qua port/facade public rõ ràng

## Frontend

```text
Route
  → Screen
    → Controller hook
      → Query/Mutation
        → API function
    → Presentational UI
```

* Route cực mỏng
* API call chỉ nằm trong `api`
* React Query chỉ nằm trong query/mutation hooks
* Router, permissions và orchestration nằm trong controller
* UI nhận props và emit events
* Pure model không phụ thuộc React
* Shared primitive chỉ lấy từ `web-core`

# 14. Thứ tự xử lý repo

Chưa cần refactor toàn bộ ngay. Làm theo thứ tự:

1. Chốt backend convention
2. Chốt frontend convention
3. Viết tài liệu canonical
4. Sửa toàn bộ AI skills/instructions lỗi thời
5. Chọn `users` làm golden frontend feature
6. Chọn một backend module làm golden backend feature
7. Thêm lint/source-policy
8. Mọi feature mới phải theo chuẩn mới
9. Refactor feature cũ từng module, không big-bang
10. Sau cùng mới tiếp tục mở rộng feature set

**Kiến trúc nền của repo không tệ**, dependency boundary và domain ADR đang khá tốt. Vấn đề là convention nằm rải rác, có bản cũ lẫn bản mới, và thiếu một frontend orchestration layer rõ ràng. Vì vậy AI vẫn tạo ra code “đúng từng file” nhưng toàn hệ thống không đồng nhất.
