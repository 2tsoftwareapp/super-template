import { Module } from "@nestjs/common";

import { NotificationsModule } from "../notifications/notifications.module";
import { RolesGuard } from "../../shared/roles.guard";
import { UsersController } from "./users.controller";
import { UsersRepository } from "./users.repository";
import { UsersService } from "./users.service";

@Module({
  imports: [NotificationsModule],
  controllers: [UsersController],
  providers: [UsersRepository, UsersService, RolesGuard],
})
export class UsersModule {}
