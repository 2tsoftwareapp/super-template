import { z } from "zod";

/**
 * Param validation shared by every client app. Route params and search params
 * are attacker-controlled strings — never hand them to a query, a filter, or a
 * date range untouched. See CODING_RULES.md §15.
 *
 * Two rules decide the shape of everything below:
 *   - a param that *identifies* a resource has no fallback → reject the URL;
 *   - a param that *presents* data always has a fallback → recover per key.
 */

// ---------------------------------------------------------------------------
// Param primitives — build feature schemas from these instead of re-deriving
// the same guards per feature.
//
// These deliberately use `.default()` and NOT `.catch()`: `.catch()` would
// swallow the failure inside the schema, so `parseSearchParams` could never
// tell a bad value from an absent one and `recoveredKeys` would always be
// empty. Failing loudly here is what lets the parser prune the key and report
// it — one recovery mechanism, in one place.
// ---------------------------------------------------------------------------

/** Identity-shaped params. One family among many — not the default case. */
export const uuidParam = z.uuid();
export const numericIdParam = z.coerce.number().int().positive();
export const slugParam = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug");

/** Closed set of allowed values — the single most common filter shape. */
export function enumParam<const T extends readonly [string, ...string[]]>(
  values: T,
  fallback: T[number],
) {
  return z.enum(values).default(fallback);
}

/** 1-based page number. Junk, zero, and negatives collapse to page 1. */
export const pageParam = z.coerce.number().int().positive().default(1);

/** Page size restricted to the sizes the UI actually offers. */
export function pageSizeParam<const T extends readonly [number, ...number[]]>(
  allowed: T,
  fallback: T[number],
) {
  return z.coerce
    .number()
    .int()
    .refine((value): value is T[number] => allowed.includes(value as T[number]), {
      message: "Unsupported page size",
    })
    .default(fallback);
}

/** Free-text search. Bounded so a giant URL cannot be turned into a payload. */
export function searchTextParam(maxLength = 200) {
  return z.string().trim().max(maxLength).default("");
}

/** ISO date (`2026-07-20`) — invalid or impossible dates become undefined. */
export const dateParam = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), { message: "Invalid date" })
  .optional();

/** Checkbox/toggle params: only the literal "true" is truthy. */
// `.default()` must sit before `.transform()`: applied after, the default value
// skips the transform and leaks the raw string "false" instead of `false`.
export const booleanParam = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

/**
 * A return/redirect target taken from the URL. Only same-origin **paths** are
 * accepted: an absolute URL, a protocol-relative `//evil.com`, or a
 * backslash-obfuscated `/\evil.com` would turn a back link into an open
 * redirect. Anything else collapses to the caller's fallback.
 */
export function internalPath(value: string | null | undefined, fallback: string): string {
  if (!value?.startsWith("/")) {
    return fallback;
  }

  // `//host` and `/\host` are both parsed as protocol-relative by browsers.
  if (value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }

  // Control characters can smuggle a scheme past the checks above.
  // eslint-disable-next-line no-control-regex -- deliberately matching control chars
  if (/[\u0000-\u001f\u007f]/.test(value)) {
    return fallback;
  }

  return value;
}

/** Sort direction with an explicit default per list. */
export function sortOrderParam(fallback: "asc" | "desc" = "desc") {
  return z.enum(["asc", "desc"]).default(fallback);
}

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

export type RouteParamResult<T> = { ok: true; data: T } | { ok: false; issues: string[] };

/**
 * Validate a route param bundle (`/users/[id]`, `/orgs/[slug]/reports/[period]`).
 * Route params address a resource, so there is no sensible fallback: an invalid
 * one means the URL points at nothing. Callers render `notFound()` on `ok: false`.
 */
export function parseRouteParams<S extends z.ZodType>(
  schema: S,
  raw: unknown,
): RouteParamResult<z.infer<S>> {
  const result = schema.safeParse(raw);

  if (result.success) {
    return { ok: true, data: result.data };
  }

  return {
    ok: false,
    issues: result.error.issues.map(
      (issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`,
    ),
  };
}

export interface SearchParamsResult<T> {
  /** Validated params — always usable, defaults filled in for bad keys. */
  data: T;
  /** Keys that failed validation and were replaced by their default. */
  recoveredKeys: string[];
}

function toRecord(
  source: URLSearchParams | Record<string, string | string[] | undefined>,
): Record<string, string | string[] | undefined> {
  if (!(source instanceof URLSearchParams)) {
    return source;
  }

  const record: Record<string, string | string[]> = {};
  for (const key of new Set(source.keys())) {
    const all = source.getAll(key);
    record[key] = all.length > 1 ? all : all[0]!;
  }
  return record;
}

/**
 * Validate presentation params (filters, paging, sorting, ranges, free text)
 * with **per-key** recovery.
 *
 * A single bad key must not blank the screen: `?page=abc&status=ACTIVE` keeps
 * the status filter and falls back to page 1. Only keys that fail are dropped;
 * the schema's defaults then refill them. Never throws.
 */
export function parseSearchParams<S extends z.ZodType>(
  schema: S,
  source: URLSearchParams | Record<string, string | string[] | undefined>,
  fallback: z.infer<S>,
): SearchParamsResult<z.infer<S>> {
  const record = toRecord(source);
  const first = schema.safeParse(record);

  if (first.success) {
    return { data: first.data, recoveredKeys: [] };
  }

  // Drop only the offending top-level keys, then let schema defaults refill
  // them. This is what keeps one malformed param from resetting the whole view.
  const badKeys = new Set(
    first.error.issues
      .map((issue) => issue.path[0])
      .filter((key): key is string => typeof key === "string"),
  );

  const pruned: Record<string, string | string[] | undefined> = {};
  for (const [key, value] of Object.entries(record)) {
    if (!badKeys.has(key)) {
      pruned[key] = value;
    }
  }

  const second = schema.safeParse(pruned);
  const recoveredKeys = [...badKeys];

  if (second.success) {
    return { data: second.data, recoveredKeys };
  }

  // The schema cannot produce a valid value even with every bad key removed
  // (a required param was absent). Fall back wholesale rather than throwing.
  return { data: fallback, recoveredKeys };
}
