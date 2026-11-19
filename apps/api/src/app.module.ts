import { Module } from "@nestjs/common";

import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { DatabaseModule } from "./shared/database.service";
import { HealthController } from "./health.controller";

@Module({
  imports: [DatabaseModule, AuthModule, UsersModule],
  controllers: [HealthController],
})
export class AppModule {}
