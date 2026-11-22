import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";

import { CurrentUser, type RequestUser } from "../../shared/current-user.decorator";
import { Roles } from "../../shared/roles.decorator";
import { RolesGuard } from "../../shared/roles.guard";
import { validate } from "../../shared/validation";
import {
  CreateNotificationDto,
  ListNotificationsQueryDto,
  type NotificationDto,
} from "./notifications.dto";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
export class NotificationsController {
  constructor(@Inject(NotificationsService) private readonly notifications: NotificationsService) {}

  @Get()
  list(
    @CurrentUser() user: RequestUser,
    @Query(validate(ListNotificationsQueryDto))
    query: ListNotificationsQueryDto,
  ) {
    return this.notifications.listForUser(user.userId, query.page, query.limit);
  }

  @Patch(":id/read")
  async markRead(
    @CurrentUser() user: RequestUser,
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<{ data: NotificationDto }> {
    return { data: await this.notifications.markRead(id, user.userId) };
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles("ADMIN")
  async create(
    @Body(validate(CreateNotificationDto)) input: CreateNotificationDto,
  ): Promise<{ data: NotificationDto }> {
    return { data: await this.notifications.create(input) };
  }
}
