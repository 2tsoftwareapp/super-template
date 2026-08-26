/**
 * Cross-feature lazy port registry.
 *
 * Used when feature A boots before feature B but needs B's port at call-time
 * (e.g. access-control / organizations → users assignment/membership ports).
 * Avoids Nest `ModuleRef` when duplicate `@nestjs/core` instances break token identity.
 */
const registry = new Map<symbol, unknown>();

export function registerLazyPort<T>(token: symbol, value: T): void {
  registry.set(token, value);
}

export function resolveLazyPort<T>(token: symbol): T {
  const value = registry.get(token);
  if (value === undefined) {
    throw new Error(
      `Lazy port ${token.description ?? String(token)} is not registered yet. ` +
        `Ensure the providing feature module constructed before this call.`,
    );
  }
  return value as T;
}
