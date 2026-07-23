# Overview: Mail feature review — Round 1

## Executive summary (80/20)

- **Status:** Review completed.
- **Recommendation:** `Needs fix`
- **Blocking findings:** H-001 delivery idempotency/state integrity; H-002 non-atomic enqueue + audit.
- **Verification:** Static review complete; no dedicated Mail test/CI evidence; full repository verification is blocked by a pre-existing Jobs port mismatch on current `main`.
- **Next action:** Return to `planning` and create fix tasks from `REVIEW.md` before execution.

## Developer overview

| Field | Value |
|---|---|
| Feature | Mail — templates, admin send, background delivery, history |
| Review round | 1 |
| Recommendation | `Needs fix` |
| Critical | 0 |
| High | 2 |
| Medium | 4 |
| Low | 1 |
| Info | 1 |
| Blocking status | H-001, H-002 |
| Review artifact | `REVIEW.md` |
| Next skill | `planning` |

## Scope

- Backend Mail module and API endpoints.
- Admin send, audit and Jobs integration.
- Template renderer and SMTP adapter.
- Delivery persistence/schema and retry semantics.
- User email preferences.
- Admin frontend Mail feature.

## Open findings

| ID | Severity | Summary | Status |
|---|---|---|---|
| H-001 | High | SMTP side effect xảy ra trước durable delivery claim; retry/concurrency có thể gửi trùng và lưu sai trạng thái. | Open |
| H-002 | High | Admin mail enqueue và audit log không atomic. | Open |
| M-001 | Medium | Required variables không reject missing/blank/wrong-type values. | Open |
| M-002 | Medium | HTML và URL attributes được nội suy raw, không context-safe escaping. | Open |
| M-003 | Medium | Platform mail action có thể enqueue organization-scoped job theo selected context. | Open |
| M-004 | Medium | SMTP staging/production không enforce TLS và không cấu hình được credentials. | Open |
| L-001 | Low | Email opt-out bị skip im lặng, không có delivery status/event. | Open |
| I-001 | Info | Pre-existing Jobs port mismatch chặn reliable whole-repo verification. | Open / outside Mail scope |

## Verification status

| Area | Status |
|---|---|
| Architecture layering | Reviewed; generally aligned |
| RBAC and throttling | Present |
| Delivery retry/idempotency | Failed review |
| Audit atomicity | Failed review |
| Template/input security | Failed review |
| SMTP production security | Needs fix / verification |
| Dedicated Mail unit tests | Evidence missing |
| Dedicated Mail E2E tests | Evidence missing |
| CI on current commit | Missing |
| Whole-repo typecheck | Blocked by pre-existing Jobs mismatch |

## Next action

Create a planning session that converts the findings into explicit tasks and acceptance criteria. Priority order:

1. H-001 durable delivery claim/state machine.
2. H-002 shared transaction for enqueue + audit.
3. M-001 strict variable validation.
4. M-002 context-safe template rendering.
5. M-003 explicit scope contract.
6. M-004 SMTP TLS/auth configuration.
7. L-001 observable suppression status.
8. Concurrency, crash-window, negative security and E2E verification.

## Handoff

- **Owner:** Agent / Developer
- **Next skill:** `planning`
- **Ready for done/PR:** No
- **Blocking:** Yes — H-001 and H-002
