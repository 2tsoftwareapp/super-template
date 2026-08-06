---
layout: default
title: Quality Rules
---

# Frontend Quality Rules

## Code-level

1. Không dùng `any` hoặc `@ts-ignore`.
2. Type import dùng `import type`.
3. Function chỉ có một trách nhiệm.
4. Tên phải mô tả rõ dữ liệu và hành động.
5. Không bỏ qua Promise; dùng `await` hoặc `void` có chủ đích.
6. Không mutate input hoặc state ngoài chủ ý.
7. External data phải được type/validate.
8. Không dùng tên mơ hồ như `data`, `result`, `helper`, `utils` nếu thiếu context.
9. Không log token, cookie, password hoặc PII.
10. Error phải có code ổn định và UI phải xử lý loading/error/empty.

## Module-level

- Route không gọi HTTP.
- UI không gọi React Query.
- Model không import React, Next router hoặc HTTP.
- Repository không import UI.
- Feature không deep-import internal file của feature khác.
- Shared package không chứa business logic riêng.

## Review thresholds

| Item | Threshold |
|---|---:|
| Function | 60 lines |
| Service/controller | 200 lines |
| UI component | 200 lines |
| Constructor dependencies | 7 |
| Component props | 15 |

Đây là ngưỡng review, không phải mục tiêu để cắt code máy móc.

## Definition of Done

```bash
pnpm --filter admin lint
pnpm --filter admin typecheck
pnpm --filter admin test
pnpm --filter admin build
```

UI flow quan trọng phải được kiểm tra bằng browser.
