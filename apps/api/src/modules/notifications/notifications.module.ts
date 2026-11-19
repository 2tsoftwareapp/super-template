import { Module } from "@nestjs/common";

import { RolesGuard } from "../../shared/roles.guard";
import { NotificationsController } from "./notifications.controller";
import { NotificationsRepository } from "./notifications.repository";
import { NotificationsService } from "./notifications.service";

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsRepository, NotificationsService, RolesGuard],
  exports: [NotificationsService],
})
export class NotificationsModule {}
