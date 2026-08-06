---
layout: default
title: State ownership
---

# State ownership

| State | Owner |
|---|---|
| Server data | TanStack Query |
| Search/filter/sort that must be shareable | URL search params |
| Form values | React Hook Form |
| Validation | Zod in feature model |
| Dialog/drawer state | Controller, or UI for visual-only state |
| Authenticated session | Admin session provider |
| Permissions | Pure selector in feature model |
| Theme/locale | Dedicated provider |

## Rules

- Do not copy server data into useState without a clear reason.
- Store bookmarkable list state in the URL.
- UI receives permission booleans, not raw permission arrays.
- Never store access or refresh tokens in localStorage.
- Use a global store only when Query, URL and Providers are insufficient.
