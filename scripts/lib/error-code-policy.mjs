/**
 * Error-code ownership policy — pure parsing and validation helpers.
 *
 * The repository has exactly three tiers of error codes (see
 * `docs/architecture/ARCHITECTURE_RULES.md` §15.2):
 *
 *   1. transport — `packages/api-runtime/src/error-codes.ts` (`ERROR_CODES`):
 *      cross-cutting HTTP/authorization outcomes usable by any feature.
 *   2. kernel-shared — `packages/api-kernel/src/errors/feature-error-codes.ts`:
 *      domain codes one feature raises on behalf of another feature's data.
 *   3. feature-owned — `packages/feature-<id>/src/public/error-codes.ts`.
 *
 * Two invariants keep the tiers from drifting into a parallel vocabulary:
 *
 *   - every code value has exactly one owning catalog;
 *   - a code raised as a bare string literal must belong to a *shared* tier
 *     (transport or kernel-shared), or be listed in `LITERAL_CODE_EXCEPTIONS`
 *     with a reason.
 *
 * The logic lives here (not in the CLI) so regression tests can exercise it
 * against synthetic source text without touching tracked files.
 */

/**
 * Bare literals that are still allowed at `new AppError(<literal>, ...)` sites.
 * Keep this list empty-by-default: an entry is a debt note, not a convention.
 * It exists only where referencing the owning constant would require a change
 * that is out of scope for this guard (a new feature dependency edge or a
 * change to another package's public contract).
 *
 * Empty since 2026-09-15: the single entry (`AUTH_INVALID_CREDENTIALS` raised by
 * feature-user-management) moved to the kernel-shared catalog, so that site now
 * references `AUTH_ERROR_CODES.AUTH_INVALID_CREDENTIALS` and there is nothing
 * left to excuse.
 *
 * @type {readonly {code: string, file: string, reason: string}[]}
 */
export const LITERAL_CODE_EXCEPTIONS = Object.freeze([]);

const CATALOG_PATTERN = /export\s+const\s+([A-Z0-9_]+)\s*=\s*\{([\s\S]*?)\}\s*as\s+const;/g;
const PAIR_PATTERN = /^\s*([A-Z][A-Z0-9_]*)\s*:\s*"([A-Z][A-Z0-9_]*)"\s*,?\s*$/gm;
const LITERAL_APP_ERROR_PATTERN = /new\s+AppError\s*\(\s*(["'])([A-Z][A-Z0-9_]*)\1/g;

/** The code values a catalog source text declares. */
export function parseCatalog(sourceText) {
  const catalogs = [];
  for (const [, name, body] of sourceText.matchAll(CATALOG_PATTERN)) {
    const codes = {};
    for (const [, key, value] of body.matchAll(PAIR_PATTERN)) codes[key] = value;
    catalogs.push({ name, codes });
  }
  return catalogs;
}

/** Every `new AppError("<LITERAL>", ...)` site in a source text, with line numbers. */
export function findLiteralCodeUsages(sourceText) {
  const usages = [];
  for (const match of sourceText.matchAll(LITERAL_APP_ERROR_PATTERN)) {
    // Point at the literal itself, not at `new AppError(` — the multi-line form
    // would otherwise send the reader to the wrong line.
    const literalOffset = match.index + match[0].lastIndexOf(match[1]);
    const line = sourceText.slice(0, literalOffset).split("\n").length;
    usages.push({ line, code: match[2] });
  }
  return usages;
}

/**
 * Code values declared by more than one catalog. The catalog a feature
 * re-exports from the kernel is not re-declared, so it stays single-owner.
 *
 * @param {readonly {file: string, catalogName: string, codes: Record<string, string>}[]} declarations
 */
export function findDuplicateOwners(declarations) {
  const owners = new Map();
  for (const { file, catalogName, codes } of declarations) {
    for (const value of Object.values(codes)) {
      const list = owners.get(value) ?? [];
      list.push(`${file}#${catalogName}`);
      owners.set(value, list);
    }
  }
  return [...owners.entries()]
    .filter(([, list]) => new Set(list).size > 1)
    .map(([code, list]) => ({ code, owners: [...new Set(list)] }));
}

/**
 * Literal `AppError` codes that no shared catalog owns.
 *
 * @param {{file: string, text: string}} source
 * @param {ReadonlySet<string>} sharedCodes transport + kernel-shared values
 * @param {readonly {code: string, file: string, reason: string}[]} exceptions
 */
export function findLiteralViolations(source, sharedCodes, exceptions = LITERAL_CODE_EXCEPTIONS) {
  return findLiteralCodeUsages(source.text)
    .filter(({ code }) => !sharedCodes.has(code))
    .filter(({ code }) => !exceptions.some((e) => e.code === code && e.file === source.file))
    .map(({ line, code }) => ({ file: source.file, line, code }));
}
