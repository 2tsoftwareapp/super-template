import type { INestApplicationContext } from "@nestjs/common";
import type { ComposedAuthorization, FeatureSeedContext } from "@repo/api-plugin-kit";
import type { DatabaseExecutor } from "@repo/database-runtime";

/**
 * Host seed context passed to composed FeatureSeeder runners.
 */
export interface SeedContext {
  readonly app: INestApplicationContext;
  readonly executor: DatabaseExecutor;
  readonly bag: Record<string, unknown>;
  /** Composed authorization contributions (resources + default grants). */
  readonly authorization: ComposedAuthorization;
}

export function toFeatureSeedContext(ctx: SeedContext): FeatureSeedContext {
  return ctx;
}
