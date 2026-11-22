import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
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
  CreateUserDto,
  ListUsersQueryDto,
  UpdateUserDto,
  UpdateUserStatusDto,
  type UserDto,
} from "./users.dto";
import { UsersService } from "./users.service";

@Controller("users")
@UseGuards(RolesGuard)
@Roles("ADMIN")
export class UsersController {
  constructor(@Inject(UsersService) private readonly users: UsersService) {}

  @Get()
  async list(@Query(validate(ListUsersQueryDto)) query: ListUsersQueryDto) {
    return this.users.list(query);
  }

  @Get(":id")
  async get(@Param("id", ParseUUIDPipe) userId: string): Promise<{ data: UserDto }> {
    return { data: await this.users.get(userId) };
  }

  @Post()
  @HttpCode(201)
  async create(@Body(validate(CreateUserDto)) input: CreateUserDto): Promise<{ data: UserDto }> {
    return { data: await this.users.create(input) };
  }

  @Patch(":id")
  async update(
    @CurrentUser() actor: RequestUser,
    @Param("id", ParseUUIDPipe) userId: string,
    @Body(validate(UpdateUserDto)) input: UpdateUserDto,
  ): Promise<{ data: UserDto }> {
    return { data: await this.users.update(actor.userId, userId, input) };
  }

  @Patch(":id/status")
  async setStatus(
    @CurrentUser() actor: RequestUser,
    @Param("id", ParseUUIDPipe) userId: string,
    @Body(validate(UpdateUserStatusDto)) input: UpdateUserStatusDto,
  ): Promise<{ data: UserDto }> {
    return { data: await this.users.setStatus(actor.userId, userId, input.status) };
  }

  @Delete(":id")
  @HttpCode(204)
  async remove(
    @CurrentUser() actor: RequestUser,
    @Param("id", ParseUUIDPipe) userId: string,
  ): Promise<void> {
    await this.users.remove(actor.userId, userId);
  }
}
