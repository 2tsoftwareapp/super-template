# @repo/api-kernel

Framework-light backend kernel: ports, `AppError`, request/tenant types, pure
helpers (CSV, email normalize, opaque tokens, password hashing), and
`TenantContextService` ALS. Features and `database-runtime` depend on this
package; it must not import `@repo/api-runtime`.
