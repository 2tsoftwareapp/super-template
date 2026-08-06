---
layout: default
title: System map
---

# System map

Bản đồ thực tế của Web Admin trong repository.

<div class="mermaid">
flowchart LR
  Browser[Browser] --> Next[apps/admin Next.js]
  Next --> Route[app routes]
  Route --> Screen[feature screen]
  Screen --> Controller[controller hook]
  Controller --> Service[service class]
  Service --> Repository[repository]
  Repository --> BFF[app/api BFF]
  BFF --> Nest[apps/api NestJS]
  Nest --> DB[(PostgreSQL)]
  Shared[shared packages] --> Next
</div>

## Runtime ownership

| Area | Owner |
|---|---|
| Routing, layout, metadata | apps/admin/src/app |
| Auth cookie/BFF boundary | apps/admin/src/app/api, src/proxy.ts |
| Feature workflow | apps/admin/src/features/<feature> |
| UI primitives | @repo/web-ui |
| Shared hooks | @repo/web-hooks |
| Web utilities | @repo/web-utils |
| Server-only web logic | @repo/web-server |
| API contract | @repo/api-contract |

## Security boundary

Browser code calls the same-origin BFF. Refresh tokens remain in HttpOnly cookies. Business authorization remains authoritative in NestJS.
