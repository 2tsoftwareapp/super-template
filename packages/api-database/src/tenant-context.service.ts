import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable } from '@nestjs/common';
import type { TenantContext } from './tenant-context';

const tenantContextStorage = new AsyncLocalStorage<TenantContext>();

@Injectable()
export class TenantContextService {
  run<T>(context: TenantContext, operation: () => T): T {
    return tenantContextStorage.run(context, operation);
  }

  get(): TenantContext | undefined {
    return tenantContextStorage.getStore();
  }

  getTenantId(): string | undefined {
    return tenantContextStorage.getStore()?.tenantId;
  }
}
