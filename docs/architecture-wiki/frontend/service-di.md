---
layout: default
title: Service and DI
---

# Service and Dependency Injection

## Dependency flow

```text
Controller
  → Service
    → Repository
      → HttpClient
```

## Service

Service class chứa business rule và orchestration:

```ts
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
  ) {}

  async deleteUser(id: string): Promise<void> {
    const user = await this.usersRepository.findById(id);

    if (user.role === "OWNER") {
      throw new UserOperationError("OWNER_CANNOT_BE_DELETED");
    }

    await this.usersRepository.delete(id);
  }
}
```

## Repository

Repository chỉ xử lý transport:

```ts
export class ApiUsersRepository implements UsersRepository {
  constructor(
    private readonly httpClient: HttpClient,
  ) {}

  findById(id: string) {
    return this.httpClient.get<User>(`/api/bff/users/${id}`);
  }
}
```

## Composition root

Dependency được tạo tại một factory hoặc composition root:

```ts
const httpClient = new FetchHttpClient();
const usersRepository = new ApiUsersRepository(httpClient);
export const usersService = new UsersService(usersRepository);
```

Không cần DI container lớn ở frontend. Constructor injection là mặc định.

## Quy tắc

- Service không import React.
- Repository không chứa business rule.
- UI không khởi tạo service.
- Không tạo pass-through service chỉ để chuyển tiếp một method.
- Dependency phải dễ thay thế trong test.
