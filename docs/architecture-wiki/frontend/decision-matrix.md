---
layout: default
title: Code placement decision matrix
---

# Code placement decision matrix

| Question | Place code in |
|---|---|
| Is it a Next.js route entry? | app/ |
| Does it call HTTP? | feature api/ or shared HTTP infrastructure |
| Is it a React Query hook? | feature api/ |
| Is it a business rule? | feature service or model |
| Is it a pure validation/parser/selector? | feature model/ |
| Does it coordinate queries, mutations and UI workflow? | feature controller |
| Does it only render markup? | feature ui/ |
| Is it the entry composition for a route? | feature screen |
| Is it shared by two features in this app? | app components or common |
| Is it a reusable primitive for both web apps? | shared package |
| Is it server-only cookie/BFF logic? | web-server or app/api |
| Is it API-generated data? | api-contract |

## Common mistakes

### Calling API from UI

Wrong: table component calls fetch.

Correct: UI emits onDelete; controller calls mutation.

### Putting business logic in route

Wrong: page.tsx checks permissions and transforms response.

Correct: route renders screen; model selects permission; controller prepares view model.

### Generic shared helper

Wrong: common/helpers.ts.

Correct: name by responsibility and keep it near the owner until a second consumer exists.

### Transaction as CRUD

Wrong: directly editing a job status from a generic form.

Correct: invoke a command such as retryJob or cancelJob and validate the lifecycle.
