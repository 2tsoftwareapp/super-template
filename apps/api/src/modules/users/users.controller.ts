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
  ValidationPipe,
} from "@nestjs/common";

import { Roles } from "../../shared/roles.decorator";
import { RolesGuard } from "../../shared/roles.guard";
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
  async list(
    @Query(new ValidationPipe({ expectedType: ListUsersQueryDto, transform: true }))
    query: ListUsersQueryDto,
  ) {
    return this.users.list(query);
  }

  @Get(":id")
  async get(@Param("id", ParseUUIDPipe) userId: string): Promise<{ data: UserDto }> {
    return { data: await this.users.get(userId) };
  }

  @Post()
  @HttpCode(201)
  async create(
    @Body(new ValidationPipe({ expectedType: CreateUserDto })) input: CreateUserDto,
  ): Promise<{ data: UserDto }> {
    return { data: await this.users.create(input) };
  }

  @Patch(":id")
  async update(
    @Param("id", ParseUUIDPipe) userId: string,
    @Body(new ValidationPipe({ expectedType: UpdateUserDto })) input: UpdateUserDto,
  ): Promise<{ data: UserDto }> {
    return { data: await this.users.update(userId, input) };
  }

  @Patch(":id/status")
  async setStatus(
    @Param("id", ParseUUIDPipe) userId: string,
    @Body(new ValidationPipe({ expectedType: UpdateUserStatusDto })) input: UpdateUserStatusDto,
  ): Promise<{ data: UserDto }> {
    return { data: await this.users.setStatus(userId, input.status) };
  }

  @Delete(":id")
  @HttpCode(204)
  async remove(@Param("id", ParseUUIDPipe) userId: string): Promise<void> {
    await this.users.remove(userId);
  }
}
