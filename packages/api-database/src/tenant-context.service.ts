import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

import type { TenantContext } from './tenant-context';

const tenantContextStorage = new AsyncLocalStorage<TenantContext>();

export const getTenantContext = (): TenantContext | undefined =>
  tenantContextStorage.getStore();

@Injectable()
export class TenantContextService {
  run<T>(context: TenantContext, operation: () => T): T {
    return tenantContextStorage.run(context, operation);
  }

  runAsync<T>(
    context: TenantContext,
    operation: () => Promise<T>,
  ): Promise<T> {
    return tenantContextStorage.run(context, operation);
  }

  get(): TenantContext | undefined {
    return tenantContextStorage.getStore();
  }

  getTenantId(): string | undefined {
    return tenantContextStorage.getStore()?.tenantId;
  }
}
