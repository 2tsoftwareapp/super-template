---
layout: default
title: Shared packages
---

# Shared packages

| Package | Responsibility | Must not contain |
|---|---|---|
| @repo/web-ui | UI primitives | API, hooks, business logic |
| @repo/web-hooks | Shared React hooks | UI markup, feature logic |
| @repo/web-utils | HTTP, session, storage, cn | React components |
| @repo/web-server | Cookies, auth server, BFF helpers | client-only code |
| @repo/api-contract | Generated OpenAPI types | duplicate handwritten DTO |
| @repo/utils | Pure cross-runtime TypeScript | React, DOM, Node-only APIs |

## Put code in shared only when

- at least two consumers need it;
- ownership is not feature-specific;
- its API is stable;
- it does not create a reverse dependency.

If only one feature uses it, keep it inside that feature.
