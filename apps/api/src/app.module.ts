import { Module } from "@nestjs/common";

import { AuthModule } from "./modules/auth/auth.module";
import { FilesModule } from "./modules/files/files.module";
import { UsersModule } from "./modules/users/users.module";
import { DatabaseModule } from "./shared/database.service";
import { StorageModule } from "./shared/storage/storage.module";
import { HealthController } from "./health.controller";

@Module({
  imports: [DatabaseModule, StorageModule, AuthModule, UsersModule, FilesModule],
  controllers: [HealthController],
})
export class AppModule {}
