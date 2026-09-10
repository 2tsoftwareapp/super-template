import { AsyncLocalStorage } from "node:async_hooks";

import type { TenantContext } from "../ports/tenant-context.port";

const tenantContextStorage = new AsyncLocalStorage<TenantContext>();

/** Read the active request/job tenant context from AsyncLocalStorage. */
export const getTenantContext = (): TenantContext | undefined => tenantContextStorage.getStore();

/**
 * ALS runner for {@link TenantContext}.
 * Lives in the kernel so database-runtime and features share one store without
 * depending on the HTTP runtime package.
 */
export class TenantContextService {
  run<T>(context: TenantContext, operation: () => T): T {
    return tenantContextStorage.run(context, operation);
  }

  runAsync<T>(context: TenantContext, operation: () => Promise<T>): Promise<T> {
    return tenantContextStorage.run(context, operation);
  }

  get(): TenantContext | undefined {
    return tenantContextStorage.getStore();
  }

  getTenantId(): string | undefined {
    return tenantContextStorage.getStore()?.tenantId;
  }
}
