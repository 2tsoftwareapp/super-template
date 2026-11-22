---
layout: home

hero:
  name: super-template
  text: A full-stack starter you can ship
  tagline: NestJS API, Next.js web and admin, Flutter mobile and a Postgres-backed worker. One database, real auth, production images, and tests that run locally.
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: Add a feature
      link: /guide/add-a-feature
    - theme: alt
      text: GitHub
      link: https://github.com/2tsoftwareapp/super-template

features:
  - title: Accounts out of the box
    details: Sign-up, sign-in, rotating refresh tokens, forgot/reset/change password by email, profile page. Blocking a user or changing a password cuts every live token at once.
  - title: Four surfaces, one API
    details: A public web app, an admin console, a Flutter app and a NestJS API, all talking to the same /api/v1 with the same error envelope.
  - title: Jobs without Redis
    details: Jobs are Postgres rows claimed with SKIP LOCKED. Retries with backoff, stale-lock recovery, permanent failures and clean shutdown.
  - title: Production-shaped
    details: One Dockerfile with a target per surface, a compose stack that migrates and seeds itself, helmet, CORS, JSON logs with request ids and a DB-aware health check.
  - title: Small on purpose
    details: One folder per backend feature, no ports with one implementation, no codegen. ESLint enforces the rules in AGENTS.md.
  - title: Verified locally
    details: "One command checks lint, types and 60+ API tests; Flutter has widget tests. No CI minutes required."
---

## What you get

|                        Web — account                         |                        Admin — users                         |
| :----------------------------------------------------------: | :----------------------------------------------------------: |
| ![Web account page](/screenshots/web-account.png){width=640} | ![Admin users page](/screenshots/admin-users.png){width=640} |
|                      **Admin — files**                       |                       **Admin — jobs**                       |
| ![Admin files page](/screenshots/admin-files.png){width=640} |  ![Admin jobs page](/screenshots/admin-jobs.png){width=640}  |

## Where to go next

| I want to…                                  | Read                                       |
| ------------------------------------------- | ------------------------------------------ |
| run it on my machine in ten minutes         | [Getting started](./guide/getting-started) |
| understand how the pieces fit               | [Architecture](./guide/architecture)       |
| build my first feature, API to every client | [Add a feature](./guide/add-a-feature)     |
| turn the template into my product           | [Make it yours](./guide/customizing)       |
| put it on a server                          | [Deployment](./guide/deployment)           |
| fix something that does not work            | [Troubleshooting](./guide/troubleshooting) |
