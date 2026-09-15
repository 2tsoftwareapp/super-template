# ADR 0004: Decouple SSO from auth via a session-issuance contract port

- Status: Proposed
- Date: 2026-09-14
- Decision owners: repository maintainers

## Context

`feature-sso` is the only layer-6 feature and `sso → auth` is the strongest
cross-feature edge left in the graph after the Tier 0 + Tier 1 decoupling
(ghost edges removed; `JOB_HANDLER_REGISTRY` / `MAIL_TEMPLATE_SENDER` moved to
kernel ports). The audit found exactly three kinds of coupling behind the edge:

| Import in `feature-sso`                                | Subpath      | Kind                                                                    | Assessment                         |
| ------------------------------------------------------ | ------------ | ----------------------------------------------------------------------- | ---------------------------------- |
| `AUTH_SESSION_REPOSITORY`, `AuthSessionRepositoryPort` | `/contracts` | port token + type                                                       | sanctioned pattern                 |
| `AUTH_TOKEN_PROVIDER`, `AuthTokenProviderPort`         | `/contracts` | port token + type                                                       | sanctioned pattern                 |
| `IssueSessionUseCase`                                  | `/contracts` | **concrete application class** injected into `HandleSsoCallbackUseCase` | the hard coupling this ADR removes |
| `hashPassword`                                         | `/contracts` | util re-exported from `@repo/api-kernel`                                | trivially reroutable               |
| `AuthModule`                                           | `/module`    | Nest module (DI wiring in `sso.module.ts`)                              | sanctioned wiring                  |

Two facts constrain the design:

1. **Issuance must be synchronous.** `HandleSsoCallbackUseCase` ends with
   `issueSessionUseCase.execute(user, requestContext)` and returns access /
   refresh tokens in the HTTP callback response. Whatever replaces the direct
   injection must produce tokens within the request.
2. **The port-shaped version already exists.** `ExchangeSsoSessionUseCase`
   (session exchange redemption) consumes auth exclusively through
   `AUTH_SESSION_REPOSITORY` and `AUTH_TOKEN_PROVIDER` ports. Only the
   callback path bypasses the pattern.

`IssueSessionUseCase` is also the shared tail of password login and the
post-MFA-challenge flow: it resolves the organization (returning `null` under
the `org-optional` model), loads the access profile, creates session tokens via
`AUTH_TOKEN_PROVIDER`, and maps the response with `AuthMapper`.

## Options considered

### 1. Session-issuance contract port — selected

Keep issuance ownership in auth; expose it behind a port token in
`feature-auth/public`, mirroring `AUTH_TOKEN_PROVIDER`:

```ts
// packages/feature-auth/src/public/session-issuer.port.ts
export interface SessionIssuanceUser {
  id: string;
  email: string;
  displayName: string | null;
}

export interface SessionIssuer {
  issue(
    user: SessionIssuanceUser,
    requestContext?: RequestContext,
    options?: { mustChangePassword?: boolean },
  ): Promise<SessionIssuanceResult>;
}

export const SESSION_ISSUER = Symbol("SESSION_ISSUER");
```

- `SessionIssuanceUser` is a narrow structural type; `AuthUserModel` satisfies
  it without exporting model internals.
- The result type reuses the existing login-response shape (`AuthMapper`
  DTOs), so SSO logins stay indistinguishable from password logins.
- `AuthModule` binds `{ provide: SESSION_ISSUER, useExisting: IssueSessionUseCase }`
  — one implementation, one owner, zero duplication.
- `feature-sso` injects `@Inject(SESSION_ISSUER)` and imports only
  `/contracts` (types + token) plus `/module` (wiring).

Why the port lives in `feature-auth`, not `@repo/api-kernel`: unlike mail and
jobs (generic infrastructure consumed by many domains), session issuance is
auth's own domain language — the result DTOs are auth's. Kernel ports fit
cross-domain mechanics; this is a domain contract. Promoting the token to the
kernel later is a mechanical move (same as the mail/jobs ports) and is
deliberately out of scope.

### 2. Outbox event — rejected for issuance, retained for side effects

An `identity.sso_login_succeeded` outbox message consumed by an auth handler
cannot deliver the login response: the outbox dispatcher runs on a schedule
(`EVERY_10_SECONDS` per ADR 0003), while the callback must return tokens now.
Deferring issuance would break the redirect contract, and having SSO mint
tokens itself via `AUTH_TOKEN_PROVIDER` + a duplicated org/profile resolution
re-implements `IssueSessionUseCase` and drifts from the login/MFA flows.

The outbox remains the right channel for **post-login side effects** (welcome
mail, provisioning fan-out) — auth already registers lifecycle handlers this
way, and SSO logins flow through the same user-lifecycle events. The ADR does
not change that.

### 3. Keep the concrete-class injection — rejected

- Pulls auth's application graph into SSO's compile graph for one call.
- Makes the auth-boundary rule unenforceable: nothing distinguishes sanctioned
  imports from internal reach-through.
- Blocks any future composition/tooling that treats auth as swappable behind
  its contracts.

## Decision

1. Add `SESSION_ISSUER` + `SessionIssuer` (with `SessionIssuanceUser` input and
   the existing login-response result type) to `feature-auth/public`.
2. Bind `SESSION_ISSUER` to `IssueSessionUseCase` in `AuthModule` (`useExisting`)
   and export the provider.
3. Rewire `HandleSsoCallbackUseCase` to inject the port; import `hashPassword`
   from `@repo/api-kernel` directly.
4. `feature-sso` must not import anything from `feature-auth` besides
   `/contracts` and `/module`.
5. Outbox usage stays as-is for side effects; no event-based issuance.

## Invariants and guardrails

1. Session issuance has exactly one implementation: `IssueSessionUseCase`. The
   port is a projection of it, not a second path.
2. Issuance happens synchronously inside the callback request. No queue in the
   critical path.
3. The port result shape must remain identical to password-login and MFA
   responses (same mapper, same DTOs), including `organizationId: null` under
   the org-optional model.
4. SSO's dependency on auth becomes contracts-only (types + tokens) plus module
   wiring — enforceable by tooling.
5. No database migration; no new tables, columns, or policies.

## Migration plan

### Phase 1 — introduce the port (non-breaking, single PR)

1. Add `public/session-issuer.port.ts` with token, interfaces, and result type;
   export from `public/contracts.ts`.
2. Add the `useExisting` binding in `AuthModule`; export the provider.
3. Switch `HandleSsoCallbackUseCase` to `@Inject(SESSION_ISSUER)`; change the
   `hashPassword` import to `@repo/api-kernel`.
4. Update `handle-sso-callback.use-case.spec.ts` to inject a `SessionIssuer`
   fake; add an auth unit test asserting `SESSION_ISSUER` resolves to
   `IssueSessionUseCase`.
5. Verify: manifest guard, turbo boundaries, api unit matrix (77 specs), SSO
   e2e suites (callback + exchange + MFA).

### Phase 2 — enforce the boundary

6. Extend the lint/boundary policy so imports of auth application classes
   outside `feature-auth` fail (the manifest guard already restricts subpaths;
   add a `no-restricted-imports` rule for `@repo/feature-auth/contracts` deep
   application paths if reach-through appears).
7. Flip this ADR to Accepted; update the feature dependency graph notes.

### Phase 3 — explicitly out of scope

- Promoting `SESSION_ISSUER` to `@repo/api-kernel` (only relevant if a
  composition without auth is ever desired — not a meaningful product state,
  since SSO is an authentication alternative to password login).
- Applying the same port treatment to other concrete cross-feature service
  injections (e.g. `OrganizationsService` in auth use cases) — worth its own
  ADR if the boundary rule starts firing there.

## Verification consequences

- SSO unit specs inject a `SessionIssuer` fake — no auth application imports in
  the test graph.
- Auth unit spec proves the `useExisting` binding so the port can never silently
  bind to nothing.
- E2E SSO suites prove synchronous issuance parity with the login flow;
  session-exchange flow is untouched.
- `pnpm run lint` (policy chain + boundaries) and the manifest dependency guard
  must stay green on every phase.

## Rollback

Single-commit revert to direct `IssueSessionUseCase` injection. The binding is
additive — no schema, seed, or contract change — so rollback carries no data
implications and no coordination with other features.
