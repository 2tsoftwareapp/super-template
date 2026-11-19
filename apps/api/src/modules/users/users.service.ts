import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { hashPassword, type UserRow } from "@lean/db";

import { AppError, ERROR_CODES } from "../../shared/errors";
import { buildPageMeta, type PageMeta } from "../../shared/pagination";
import { UsersRepository, type ListUsersInput } from "./users.repository";
import type { CreateUserDto, UpdateUserDto, UserDto } from "./users.dto";

const toUserDto = (user: UserRow): UserDto => ({
  id: user.id,
  email: user.email,
  displayName: user.displayName,
  role: user.role,
  status: user.status,
  createdAt: user.createdAt.toISOString(),
});

@Injectable()
export class UsersService {
  constructor(@Inject(UsersRepository) private readonly users: UsersRepository) {}

  async list(input: ListUsersInput): Promise<{ data: UserDto[]; meta: PageMeta }> {
    const { rows, total } = await this.users.list(input);

    return {
      data: rows.map(toUserDto),
      meta: buildPageMeta(total, input.page, input.limit),
    };
  }

  async get(userId: string): Promise<UserDto> {
    return toUserDto(await this.requireUser(userId));
  }

  async create(input: CreateUserDto): Promise<UserDto> {
    const email = input.email.trim().toLowerCase();

    if (await this.users.findByEmail(email)) {
      throw new AppError(ERROR_CODES.USER_EMAIL_TAKEN, "Email is already registered", 409);
    }

    const user = await this.users.create({
      email,
      passwordHash: hashPassword(input.password),
      displayName: input.displayName.trim(),
      role: input.role,
    });

    return toUserDto(user);
  }

  async update(userId: string, input: UpdateUserDto): Promise<UserDto> {
    await this.requireUser(userId);

    const user = await this.users.update(userId, {
      ...(input.displayName !== undefined ? { displayName: input.displayName.trim() } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
    });

    if (!user) {
      throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND);
    }

    return toUserDto(user);
  }

  async setStatus(userId: string, status: "ACTIVE" | "BLOCKED"): Promise<UserDto> {
    await this.requireUser(userId);

    const user = await this.users.update(userId, { status });

    if (!user) {
      throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND);
    }

    return toUserDto(user);
  }

  async remove(userId: string): Promise<void> {
    const deleted = await this.users.remove(userId);

    if (!deleted) {
      throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND);
    }
  }

  private async requireUser(userId: string): Promise<UserRow> {
    const user = await this.users.findById(userId);

    if (!user) {
      throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND);
    }

    return user;
  }
}
