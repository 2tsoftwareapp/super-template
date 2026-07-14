/**
 * Opaque DB transaction handle passed across bounded-context boundaries.
 * Only infrastructure implementations create/resolve this type — application
 * layer never inspects or casts it.
 */
export type TransactionExecutor = unknown;
