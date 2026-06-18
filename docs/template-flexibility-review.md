# Template Flexibility Review

## Goal

Assess whether this repository is a reusable template for many product cases, not just the current demo domain.

This review focuses on:

- backend modularity
- frontend/client replaceability
- domain neutrality
- operational portability
- contract and tooling consistency

## Executive Summary

The template is strong as a production-oriented full-stack starter, especially on backend structure, API contracts, and operational defaults. It is already reusable for teams building:

- SaaS CRUD applications
- internal tools
- admin-heavy platforms
- multi-client products with web and mobile surfaces

It is not yet fully neutral as a "many use cases" template because some important parts still assume the current demo shape:

- auth differs by client surface
- imports/exports are still project-demo specific
- mobile is attached to the repo operationally, but not integrated into the JS workspace graph
- admin is a separate client architecture rather than a reusable variant of the web BFF model

## Reuse Rating

| Area | Rating | Notes |
| --- | --- | --- |
| Monorepo structure | Strong | Clear app/package split with enforceable boundaries |
| Backend modularity | Strong | Bounded contexts and port-based composition are solid |
| API contract reuse | Strong | OpenAPI generation supports web/admin/mobile reuse |
| Web client architecture | Strong | BFF model is reusable for browser-first products |
| Admin client architecture | Moderate | Useful, but auth/session model diverges from web |
| Mobile integration | Moderate | Good app structure, weaker repo/CI integration |
| Auth capability reuse | Moderate | Core API is reusable, client implementations are inconsistent |
| RBAC / tenancy | Strong | Good default for SaaS and multi-tenant admin cases |
| Background jobs / storage / mail | Strong | General-purpose capabilities with reasonable separation |
| Import/export framework | Weak to Moderate | Still coupled to the demo `projects` domain |
| Demo domain neutrality | Moderate | `projects` is a decent sample, but still leaks into reusable modules |
| Verification / delivery pipeline | Moderate | Good coverage for JS apps, less uniform for mobile and infra-dependent paths |

## What Is Already Flexible

### 1. Monorepo and dependency boundaries

The repo shape is appropriate for reuse:

- `apps/` separates delivery surfaces cleanly
- `packages/` separates backend concerns by bounded context
- `turbo.json` enforces dependency boundaries by layer tags
- policy scripts prevent cross-package drift

This is the right base for a reusable template because teams can remove or add product surfaces without rewriting the whole backend.

### 2. Backend package design

The backend is the strongest part of the template.

Reusable strengths:

- bounded contexts: `api-identity`, `api-platform`, `api-workspace`
- layered module structure: `presentation -> application -> infrastructure`
- explicit repositories instead of a generic repository abstraction
- port tokens in `api-core` to reduce direct cross-package coupling

This gives good flexibility for:

- replacing demo features
- adding new capabilities
- splitting the modular monolith later if needed

### 3. Capability modules

Several backend capabilities already look reusable enough for many products:

- auth
- users
- access control
- audit
- notifications
- jobs
- mail
- storage
- files
- attachments
- settings
- comments
- activities
- invitations

These are useful in many cases beyond the sample domain.

### 4. API contract flow

The OpenAPI-driven contract flow is one of the best reuse features in the repo:

- API generates OpenAPI
- TypeScript contracts feed web/admin
- Dart client feeds mobile

This makes the template practical for multi-client products and reduces duplication when APIs change.

### 5. SaaS-oriented authority model

The role model and tenancy defaults are solid for reusable SaaS foundations:

- `USER`
- `ADMIN`
- `SUPER_ADMIN`
- Postgres RLS
- explicit organization context

This is strong for:

- B2B SaaS
- internal multi-tenant tooling
- products with platform and tenant admin layers

## Where Flexibility Is Limited

### 1. Auth is not standardized across clients

The backend auth capability is reusable, but the client session model is not unified:

- web uses a Next.js BFF with `HttpOnly` cookies
- mobile uses secure storage and direct API access
- admin uses direct API access with browser-managed bearer tokens

This creates avoidable variation in:

- session transport
- refresh logic
- CSRF behavior
- security posture

Impact:

- replacing auth later is more expensive than it should be
- teams must understand multiple client auth patterns
- admin and web cannot be treated as simple variations of the same browser strategy

Target state:

- define one standard browser auth architecture
- treat admin either as another BFF client or explicitly document it as a separate trust model

### 2. Import/export is still demo-domain specific

The repo describes imports/exports as reusable capabilities, but the implementation still assumes `projects`.

Current coupling:

- export service only supports `projects`
- import confirmation logic applies project-specific rules
- the port is named `PROJECT_DEMO_GATEWAY`

Impact:

- replacing the demo domain means refactoring platform capability modules
- the sample domain leaks upward into supposedly reusable layers

Target state:

- replace `PROJECT_DEMO_GATEWAY` with generic import/export adapters
- register import/export handlers by type
- move CSV field mapping into domain-owned adapters

### 3. Mobile is operationally separate from the main workspace graph

The mobile app is valuable, but it behaves more like an attached subproject than a first-class workspace package.

Current limitations:

- not part of `pnpm-workspace.yaml`
- not part of Turbo task orchestration
- verified through shell wrappers and conditional skips

Impact:

- weaker consistency in CI and local workflows
- harder to guarantee cross-surface refactors remain green
- more manual knowledge required for template adopters

Target state:

- either promote mobile as a first-class repo citizen with clearer orchestration
- or explicitly document mobile as an optional companion app rather than a fully integrated surface

### 4. Admin is useful but not yet a reusable browser pattern

The admin app is structurally separate and good for many products, but it is not aligned with the web app architecture.

Current mismatch:

- web: BFF + `HttpOnly` cookies
- admin: direct API + bearer tokens

Impact:

- more than one browser auth/security model
- duplicated transport concerns
- harder reuse when a product wants two browser surfaces with shared auth semantics

Target state:

- either move admin behind a BFF too
- or isolate and document admin as a trusted-ops client profile with explicit tradeoffs

### 5. Demo domain still shapes the template story

`projects` is a reasonable sample domain, but it still appears in places that should be generic.

Good:

- it is simple enough to understand
- it shows RBAC, ownership, audit, import/export, and attachments

Less good:

- it becomes the default mental model for multiple capabilities
- some names and ports are still demo-specific

Target state:

- keep `projects` as the sample domain
- remove project-specific assumptions from reusable capability modules
- label sample-only code clearly

## Capability-by-Capability Review

### Identity and access

Status: Strong backend, Moderate overall reuse

Strengths:

- auth flows are production-oriented
- session revocation is deliberate
- RBAC is already generalized
- organization-aware tenancy is useful across many cases

Limits:

- client auth implementations diverge
- browser auth is not standardized across web and admin

Recommendation:

- standardize browser auth before calling the template "multi-surface reusable"

### Notifications

Status: Strong

Why:

- inbox + SSE + optional FCM is broadly reusable
- works for both web and mobile product shapes

Recommendation:

- keep as-is, document event model and extension points

### Files / attachments / storage

Status: Strong

Why:

- generic infrastructure
- useful across many domains
- polymorphic attachment approach is template-friendly

Recommendation:

- keep generic boundaries strict

### Jobs

Status: Strong

Why:

- PostgreSQL-backed queue is pragmatic
- good fit for templates that do not want immediate Redis or external queue requirements

Recommendation:

- document when to keep Postgres queue vs replace with a dedicated job system

### Mail

Status: Strong

Why:

- SMTP + templates + delivery logging is generally reusable

Recommendation:

- keep transport pluggable and separate branding/content from infra

### Settings / preferences

Status: Strong

Why:

- common capability across many SaaS products

Recommendation:

- document recommended split between product config, tenant config, and user preferences

### Comments / activities / invitations

Status: Strong

Why:

- generic collaboration capabilities
- useful in many admin/workflow products

Recommendation:

- continue using entity-agnostic interfaces where possible

### Imports / exports

Status: Weak to Moderate

Why:

- framework intent is reusable
- implementation is still bound to the sample domain

Recommendation:

- introduce handler registry per entity type
- move mapping/parsing into domain adapters

### Web app

Status: Strong

Why:

- BFF model is a strong reusable default
- good security posture for browser apps

Recommendation:

- keep web as the canonical browser architecture

### Admin app

Status: Moderate

Why:

- useful separate surface
- but currently inconsistent with web auth/session architecture

Recommendation:

- either align with BFF or explicitly define it as an ops-client variant

### Mobile app

Status: Moderate

Why:

- feature structure is sensible
- generated client is a strong choice
- secure storage and refresh path are solid

Limits:

- integration with the main repo workflow is weaker than for JS apps

Recommendation:

- improve CI/story around mobile ownership and verification

## Gaps That Matter Most for a Reusable Template

### Priority 1

- standardize browser auth architecture across web and admin
- decouple imports/exports from `projects`
- rename sample-specific ports and tokens away from demo terminology

### Priority 2

- define a clearer "optional surfaces" policy for admin and mobile
- improve first-class workflow integration for mobile
- separate sample-domain documentation from capability documentation

### Priority 3

- add a formal extension guide:
  - how to replace the demo domain
  - how to add a new capability module
  - how to add a new client surface
  - how to add a new import/export type

## Recommended Positioning

Today, this repo should be positioned as:

"A production-oriented SaaS starter with reusable platform capabilities and a sample domain."

It should not yet be positioned as:

"A domain-neutral template ready for any product shape with minimal adaptation."

That stronger claim becomes defensible after:

- client auth is standardized
- project-specific capability leakage is removed
- mobile and admin integration choices are made explicit

## Suggested Roadmap

### Phase 1: remove unnecessary coupling

- convert `PROJECT_DEMO_GATEWAY` to a generic import/export adapter model
- isolate sample-domain mapping logic
- audit capability modules for demo-specific names

### Phase 2: unify client architecture where practical

- make admin auth consistent with web, or document the intentional divergence
- define a canonical browser session pattern
- document allowed exceptions by client type

### Phase 3: improve template adoption experience

- add "replace the sample domain" guide
- add "choose your surfaces" guide
- add "capability matrix" in README
- document which modules are:
  - core reusable
  - optional reusable
  - sample/demo only

## Final Assessment

This template is already good and reusable for a narrow but important category:

- multi-tenant SaaS
- admin-heavy business applications
- products needing web, admin, and mobile clients

Its main weakness is not code quality. The weakness is incomplete separation between:

- reusable platform capability
- client-specific delivery strategy
- sample domain/demo logic

If the goal is "template reusable for many case", the next work should focus on removing those remaining assumptions rather than adding more features.
