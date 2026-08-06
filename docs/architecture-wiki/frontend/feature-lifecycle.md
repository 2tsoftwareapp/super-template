---
layout: default
title: Feature lifecycle
---

# Feature lifecycle

## 1. Start with a use case

Before creating folders, define:

- actor;
- master or transaction;
- read operations;
- write commands;
- permission requirements;
- loading, empty and error behavior;
- URL state;
- API contract changes.

## 2. Choose the smallest structure

### Simple read-only feature

route → screen → query → UI

### CRUD master feature

route → screen → controller → queries/mutations → service/repository → UI

### Transaction feature

route → screen → controller → command service → lifecycle policy → repository → UI

Do not create service, repository or state-machine files when the feature has no behavior requiring them.

## 3. Implement in order

1. API contract and response shape.
2. Feature model and validation.
3. Repository/API transport.
4. Service business rules.
5. Query and mutation hooks.
6. Controller workflow.
7. Screen composition.
8. Presentational UI.
9. Tests and browser verification.

## 4. Review questions

- Can another developer predict where each piece belongs?
- Can the service be tested without React?
- Can the repository be replaced with a fake?
- Can the UI render with fixture data?
- Can the URL be copied and reopened?
- Are permissions checked by both UI and API?
- Are transaction transitions explicit?
- Is any code duplicated across features?

## 5. Legacy migration

When touching an old feature:

- do not perform a broad rewrite automatically;
- preserve working behavior first;
- move only the touched responsibility;
- add a characterization test;
- update the feature index;
- document temporary exceptions;
- remove the exception when the feature is migrated.

New code follows this architecture immediately. Legacy code is migrated incrementally.
