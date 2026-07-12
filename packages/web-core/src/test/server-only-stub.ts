// Vitest stand-in for the `server-only` marker package: the real module
// throws when bundled into a Client Component; in node-based tests it must be
// a no-op so server modules can be unit-tested.
export {};
