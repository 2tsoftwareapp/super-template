---
layout: default
title: Frontend Diagrams
---

# Frontend Diagrams

## Request flow

```mermaid
flowchart TD
  Route[Next.js Route] --> Screen[Feature Screen]
  Screen --> Controller[Controller Hook]
  Controller --> Service[Service Class]
  Service --> Repository[Repository]
  Repository --> Http[HttpClient]
  Http --> BFF[Next.js BFF]
  BFF --> API[NestJS API]
```

## UI flow

```mermaid
flowchart TD
  Controller[Controller ViewModel] --> Screen[Screen]
  Screen --> UI[Feature UI]
  UI --> Primitive[Shared UI Primitive]
```

## Dependency rule

```text
app
  ↓
screen
  ↓
controller
  ↓
service
  ↓
repository
  ↓
http-client
```

UI receives data and callbacks from the screen/controller path. UI never reaches down into API or service layers.
