---
layout: default
title: Reference Feature
---

# Golden Reference Feature: Users

Every new admin feature should follow this shape unless an ADR approves a different pattern.

```text
features/users/
├── users.controller.ts
├── users.service.ts
├── users.repository.ts
├── users.model.ts
├── users.screen.tsx
├── users.test.ts
└── ui/
    ├── users-table.tsx
    ├── users-toolbar.tsx
    └── user-form.tsx
```

## Responsibilities

### Controller

- owns React Query;
- owns URL and local interaction state;
- calls the service;
- maps state to a view model.

### Service

- is a class;
- receives dependencies through the constructor;
- owns user business rules;
- does not import React or Next.js.

### Repository

- is a class implementing a repository interface;
- owns API paths and transport mapping;
- does not decide permissions or business transitions.

### Model

- owns types, Zod schemas and pure permission selectors;
- has no HTTP or React dependency.

### UI

- receives typed props;
- renders loading, empty, error and data states;
- emits callbacks;
- does not call API or router.

## Example flow

```ts
const result = await usersService.deleteUser(userId);
```

The service may validate whether the user can be deleted. The UI only emits `onDelete(userId)`.

## Verification

```bash
pnpm --filter admin lint
pnpm --filter admin typecheck
pnpm --filter admin test
pnpm --filter admin build
```
