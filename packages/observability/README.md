# @repo/observability

Nest-friendly error reporting (Sentry + optional Telegram). Injected via
`ErrorReporterService`; duck-typed against host env so it stays decoupled from
`@repo/api-runtime` internals.
