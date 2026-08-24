```markdown
# super-template Development Patterns

> Auto-generated skill from repository analysis

## Overview

This skill teaches the core development conventions and workflows for the `super-template` TypeScript monorepo. It covers file and code style, commit practices, testing patterns, and common repository maintenance workflows. The goal is to ensure consistency, maintainability, and high code quality across all packages and applications in the repository.

---

## Coding Conventions

### File Naming

- **Style:** kebab-case
- **Example:**  
  ```
  user-service.ts
  api-client.spec.ts
  ```

### Import Style

- **Use path aliases where configured.**
- **Example:**
  ```typescript
  import { fetchUser } from '@core/user-service'
  ```

### Export Style

- **Prefer named exports.**
- **Example:**
  ```typescript
  // Good
  export function fetchUser(id: string) { ... }

  // Avoid default exports
  // export default function fetchUser(id: string) { ... }
  ```

### Commit Messages

- **Conventional commits:**  
  Prefixes: `fix`, `chore`, `test`, `docs`, `feat`, `style`
- **Example:**
  ```
  feat(api): add user authentication endpoint
  fix(core): resolve type error in user-service
  ```

---

## Workflows

### Remove Generated or Artifact Files

**Trigger:** When you need to clean up generated, artifact, or environment-specific files and prevent them from being tracked in the future.  
**Command:** `/cleanup-artifacts`

1. Identify generated or artifact files (e.g., logs, exports, extension artifacts).
2. Delete these files from the repository.
3. Update `.gitignore` to include relevant directories or file patterns.
4. Optionally, update documentation if any references to these files exist.

**Example:**
```bash
rm -rf packages/extension/artifacts/*
echo "packages/extension/artifacts/" >> .gitignore
```

**Files Involved:**
- `.gitignore`
- `packages/extension/artifacts/*`
- `apps/api/storage/exports/*`
- `.mcp.json`
- `skills-lock.json`
- `DESIGN_FEATURES.md`
- `docs/architecture.md`
- `docs/*review*.md`
- `docs/*plan*.md`

---

### Add or Update Tests for Core Modules

**Trigger:** When you want to improve test coverage for core modules or add tests for new features.  
**Command:** `/add-tests`

1. Identify core modules/packages lacking tests or with uncovered logic.
2. Create new test files (`*.spec.ts`) or update existing ones.
3. Update test runner configuration (e.g., `vitest.config.ts`, `package.json` test scripts) if necessary.
4. Run tests locally or in CI to verify they are picked up and passing.

**Example:**
```typescript
// packages/user/src/user-service.spec.ts
import { describe, it, expect } from 'vitest'
import { fetchUser } from './user-service'

describe('fetchUser', () => {
  it('returns user data', () => {
    expect(fetchUser('123')).toEqual({ id: '123', name: 'Alice' })
  })
})
```

**Files Involved:**
- `packages/*/src/**/*.spec.ts`
- `apps/api/vitest.config.ts`
- `apps/api/package.json`

---

### Fix Lint or Type Errors Monorepo-wide

**Trigger:** When you need to resolve lint or type errors across multiple packages or apps.  
**Command:** `/fix-lint`

1. Run lint/type check scripts locally or via CI to identify errors.
2. Update source files to fix issues (e.g., type/interface changes, import ordering).
3. Update or add ESLint/Vitest config as needed.
4. Re-run lint/verify scripts to confirm all errors are resolved.

**Example:**
```bash
pnpm lint
pnpm typecheck
# Fix any reported issues in the relevant files
```

**Files Involved:**
- `eslint.config.mjs`
- `packages/*/src/**/*.ts`
- `apps/*/src/**/*.ts`
- `apps/*/vitest.config.ts`
- `packages/*/package.json`

---

## Testing Patterns

- **Framework:** [Vitest](https://vitest.dev/)
- **Test file pattern:** `*.spec.ts`
- **Location:** Place test files alongside implementation or in a `__tests__` directory within each package.
- **Example:**
  ```typescript
  // packages/core/src/math.spec.ts
  import { add } from './math'

  test('add returns the sum', () => {
    expect(add(2, 3)).toBe(5)
  })
  ```
- **Configuration:**  
  - Each app/package may have its own `vitest.config.ts`.
  - Test scripts are defined in the relevant `package.json`.

---

## Commands

| Command           | Purpose                                                      |
|-------------------|--------------------------------------------------------------|
| /cleanup-artifacts| Remove generated/artifact files and update .gitignore         |
| /add-tests        | Add or update tests for core modules/packages                 |
| /fix-lint         | Fix lint or type errors across the monorepo                   |
```
