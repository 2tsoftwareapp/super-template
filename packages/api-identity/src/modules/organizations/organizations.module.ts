import { Module } from '@nestjs/common';
import { ORGANIZATION_LOOKUP } from '@repo/api-core';

import { AccessControlModule } from '../access-control/access-control.module';
import { OrganizationsService } from './application/organizations.service';
import { OrganizationsRepository } from './infrastructure/organizations.repository';
import { OrganizationsController } from './presentation/organizations.controller';

@Module({
  imports: [AccessControlModule],
  controllers: [OrganizationsController],
  providers: [
    OrganizationsRepository,
    OrganizationsService,
    {
      provide: ORGANIZATION_LOOKUP,
      useExisting: OrganizationsRepository,
    },
  ],
  exports: [
    OrganizationsRepository,
    OrganizationsService,
    ORGANIZATION_LOOKUP,
  ],
})
export class OrganizationsModule {}
