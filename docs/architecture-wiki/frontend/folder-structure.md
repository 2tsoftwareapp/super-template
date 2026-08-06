---
layout: default
title: Folder Structure
---

# Folder Structure

```text
apps/admin/src/
├── app/
├── features/
│   └── users/
│       ├── users.controller.ts
│       ├── users.service.ts
│       ├── users.repository.ts
│       ├── users.model.ts
│       ├── users.screen.tsx
│       └── ui/
├── components/
├── common/
├── hooks/
├── lib/
└── proxy.ts
```

## Feature ownership

Mỗi feature tự sở hữu:

- API access;
- service;
- model;
- controller;
- screen;
- UI composite.

Không đặt code nghiệp vụ của feature vào `components/`, `lib/` hoặc `common/`.

## Shared code

- Primitive UI → `@repo/web-ui`
- Shared React hooks → `@repo/web-hooks`
- Web utilities → `@repo/web-utils`
- Server-only web logic → `@repo/web-server`
- Pure runtime-agnostic code → `@repo/utils`

## Khi nào đưa code vào common?

Chỉ khi code:

1. được dùng bởi ít nhất hai feature;
2. không chứa business rule của một feature;
3. có tên và trách nhiệm cụ thể;
4. không tạo dependency ngược.

Không tạo các file mơ hồ như `common/utils.ts`, `common/helpers.ts`.
