---
layout: default
title: Request flow
---

# Request flow

## Read flow

<div class="mermaid">
sequenceDiagram
  participant UI
  participant C as Controller
  participant Q as Query
  participant R as Repository
  participant B as BFF
  participant A as NestJS API
  UI->>C: open page
  C->>Q: useQuery
  Q->>R: list(params)
  R->>B: same-origin request
  B->>A: attach auth context
  A-->>B: typed response
  B-->>R: normalized response
  R-->>Q: server state
  Q-->>C: view model
  C-->>UI: render
</div>

## Write flow

UI event → controller handler → mutation → service → repository → BFF → NestJS command → invalidate query → updated UI.

## Rules

- Only api functions and shared HTTP infrastructure call HTTP.
- Query keys use factories.
- Mutation hooks do not own toast or navigation.
- Controllers own workflow-specific UI behavior.
- UI emits events and does not know endpoint paths.
