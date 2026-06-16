import { Module } from '@nestjs/common';
import { OrganizationsService } from './application/organizations.service';
import { OrganizationsRepository } from './infrastructure/organizations.repository';
import { OrganizationsController } from './presentation/organizations.controller';

@Module({
  controllers: [OrganizationsController],
  providers: [OrganizationsRepository, OrganizationsService],
  exports: [OrganizationsRepository, OrganizationsService],
})
export class OrganizationsModule {}
