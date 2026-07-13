/**
 * Vitest stub for the "server-only" package.
 * The real package is guarded by Next.js bundler; tests don't go through it,
 * so we provide a no-op module that vitest can resolve at import time.
 */
export default {};
