import type { INestApplicationContext } from "@nestjs/common";
import type { DatabaseClient } from "@repo/database-runtime";

import { WORKER_DISPATCH_CONTEXT } from "@repo/api-kernel";
import { EnvironmentService } from "@repo/api-runtime";
import { TenantContextService } from "@repo/api-runtime";
import { DATABASE } from "@repo/database-runtime";

// Keep the local compatibility export so CLI unit tests can replace the composed
// seeders without loading the full feature graph; it resolves to the shared source.
import { composedAuthorization, composedSeeders } from "../../composition/composed-schema";
import { type SeedContext, toFeatureSeedContext } from "./seed-context";

export const seedDatabase = async (app: INestApplicationContext): Promise<void> => {
  const database = app.get<DatabaseClient>(DATABASE);
  const tenantContextService = app.get(TenantContextService);
  // Touch EnvironmentService so misconfigured env fails before entering the tx.
  app.get(EnvironmentService);

  await tenantContextService.runAsync(WORKER_DISPATCH_CONTEXT, () =>
    database.transaction(async (transaction) => {
      const ctx: SeedContext = {
        app,
        executor: transaction,
        bag: {},
        authorization: composedAuthorization,
      };

      for (const seeder of composedSeeders) {
        await seeder.run(toFeatureSeedContext(ctx));
      }
    }),
  );
};
