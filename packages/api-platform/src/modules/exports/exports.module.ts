import { Module } from '@nestjs/common';
import { ProjectsModule } from '@repo/api-workspace/modules/projects/projects.module';

import { AuditModule } from '../audit/audit.module';
import { FilesModule } from '../files/files.module';
import { StorageModule } from '../storage/storage.module';
import { ExportsService } from './application/exports.service';
import { ExportJobsRepository } from './infrastructure/export-jobs.repository';
import { ExportsController } from './presentation/exports.controller';

@Module({
  imports: [AuditModule, FilesModule, ProjectsModule, StorageModule],
  controllers: [ExportsController],
  providers: [ExportJobsRepository, ExportsService],
  exports: [ExportJobsRepository, ExportsService],
})
export class ExportsModule {}
