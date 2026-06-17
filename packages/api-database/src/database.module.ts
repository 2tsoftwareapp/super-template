import type { Pool } from 'pg';

import {
  Global,
  Inject,
  Module,
  type OnApplicationShutdown,
} from '@nestjs/common';

import { DatabaseRlsGuard } from './database-rls.guard';
import { DATABASE_POOL, databaseProviders } from './database.provider';
import { TenantContextService } from './tenant-context.service';

@Global()
@Module({
  providers: [...databaseProviders, TenantContextService, DatabaseRlsGuard],
  exports: [...databaseProviders, TenantContextService],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}
