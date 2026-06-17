import { Module } from '@nestjs/common';
import { ProjectsModule } from '@repo/api-workspace/modules/projects/projects.module';

import { AuditModule } from '../audit/audit.module';
import { FilesModule } from '../files/files.module';
import { StorageModule } from '../storage/storage.module';
import { ImportsService } from './application/imports.service';
import { ImportJobsRepository } from './infrastructure/import-jobs.repository';
import { ImportsController } from './presentation/imports.controller';

@Module({
  imports: [AuditModule, FilesModule, ProjectsModule, StorageModule],
  controllers: [ImportsController],
  providers: [ImportJobsRepository, ImportsService],
  exports: [ImportJobsRepository, ImportsService],
})
export class ImportsModule {}
