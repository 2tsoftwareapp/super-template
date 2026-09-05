# @repo/api-sort

Single implementation of multi-column sort parsing/formatting
(`sort=field:asc,other:desc`), allow-list validated.

Import this package directly from both backend and frontend:

```ts
import { parseSortParam, formatSortParam } from "@repo/api-sort";
```

There is no re-export through `@repo/api-runtime` or `@repo/api-contract`.
