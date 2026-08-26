/**
 * Hard bound on how many rows a single synchronous export may materialize in
 * memory and serialize to CSV. Exports beyond this fail with a clear error so
 * a large tenant cannot trigger an unbounded request-time export; callers
 * should narrow their filters instead.
 */
export const MAX_EXPORT_ROWS = 50_000;
