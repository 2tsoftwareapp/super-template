import type { Pool } from 'pg';

import {
  Global,
  Inject,
  Module,
  type OnApplicationShutdown,
} from '@nestjs/common';

import { DATABASE_POOL, databaseProviders } from './database.provider';
import { TenantContextService } from './tenant-context.service';

@Global()
@Module({
  providers: [...databaseProviders, TenantContextService],
  exports: [...databaseProviders, TenantContextService],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}
