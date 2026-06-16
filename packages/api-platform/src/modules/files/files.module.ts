import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { StorageModule } from '../storage/storage.module';
import { FilesService } from './application/files.service';
import { FilesRepository } from './infrastructure/files.repository';
import { FilesController } from './presentation/files.controller';

@Module({
  imports: [StorageModule, AuditModule],
  controllers: [FilesController],
  providers: [FilesRepository, FilesService],
  exports: [FilesRepository, FilesService],
})
export class FilesModule {}
