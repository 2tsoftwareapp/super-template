# @repo/api-sort

Single implementation of multi-column sort parsing/formatting (`sort=field:asc,other:desc`), allow-list validated.

Do not import this package directly from apps:

- backend code → `@repo/api-runtime` (re-export)
- frontend code → `@repo/api-contract/sort/multi-sort` (re-export)

This keeps dependency direction clean while there is exactly one implementation.
