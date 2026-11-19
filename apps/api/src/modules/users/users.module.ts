import { Module } from "@nestjs/common";

import { RolesGuard } from "../../shared/roles.guard";
import { UsersController } from "./users.controller";
import { UsersRepository } from "./users.repository";
import { UsersService } from "./users.service";

@Module({
  controllers: [UsersController],
  providers: [UsersRepository, UsersService, RolesGuard],
})
export class UsersModule {}
