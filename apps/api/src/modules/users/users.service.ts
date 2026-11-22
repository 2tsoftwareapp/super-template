import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { hashPassword, type UserRow } from "@lean/db";

import { isUniqueViolation } from "../../shared/database-errors";
import { DatabaseService } from "../../shared/database.service";
import { AppError, ERROR_CODES } from "../../shared/errors";
import { buildPageMeta, type PageMeta } from "../../shared/pagination";
import { AuthService } from "../auth/auth.service";
import { NotificationsService } from "../notifications/notifications.service";
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

const userNotFound = (): AppError =>
  new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND);

/** An admin cannot lock themselves out: no self-block, self-delete or self-demotion. */
function assertNotSelf(actorId: string, userId: string, action: string): void {
  // ParseUUIDPipe accepts upper-case hex; Postgres compares the value, so must we.
  if (actorId.toLowerCase() === userId.toLowerCase()) {
    throw new AppError(
      ERROR_CODES.USER_SELF_ACTION_FORBIDDEN,
      `You cannot ${action} your own account`,
      HttpStatus.FORBIDDEN,
    );
  }
}

@Injectable()
export class UsersService {
  constructor(
    @Inject(UsersRepository) private readonly users: UsersRepository,
    @Inject(NotificationsService) private readonly notifications: NotificationsService,
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}

  async list(input: ListUsersInput): Promise<{ data: UserDto[]; meta: PageMeta }> {
    const { rows, total } = await this.users.list(input);

    return {
      data: rows.map(toUserDto),
      meta: buildPageMeta(total, input.page, input.limit),
    };
  }

  async get(userId: string): Promise<UserDto> {
    const user = await this.users.findById(userId);

    if (!user) {
      throw userNotFound();
    }

    return toUserDto(user);
  }

  /** The unique index on `users.email` is the check: a pre-read would race. */
  async create(input: CreateUserDto): Promise<UserDto> {
    const passwordHash = hashPassword(input.password);

    try {
      return await this.database.transaction(async () => {
        const user = await this.users.create({
          email: input.email.trim().toLowerCase(),
          passwordHash,
          displayName: input.displayName.trim(),
          role: input.role,
        });

        await this.notifications.create({
          userId: user.id,
          type: "user.welcome",
          title: "Welcome",
          body: `Hi ${user.displayName}, your account is ready.`,
        });

        return toUserDto(user);
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new AppError(ERROR_CODES.USER_EMAIL_TAKEN, "Email is already registered", 409);
      }

      throw error;
    }
  }

  async update(actorId: string, userId: string, input: UpdateUserDto): Promise<UserDto> {
    if (input.role !== undefined && input.role !== "ADMIN") {
      assertNotSelf(actorId, userId, "demote");
    }

    const user = await this.users.update(userId, {
      ...(input.displayName !== undefined ? { displayName: input.displayName.trim() } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
    });

    if (!user) {
      throw userNotFound();
    }

    return toUserDto(user);
  }

  async setStatus(actorId: string, userId: string, status: "ACTIVE" | "BLOCKED"): Promise<UserDto> {
    if (status === "BLOCKED") {
      assertNotSelf(actorId, userId, "block");
    }

    const user = await this.users.update(userId, { status });

    if (!user) {
      throw userNotFound();
    }

    if (status === "BLOCKED") {
      await this.auth.revokeAllSessions(userId);
    }

    return toUserDto(user);
  }

  async remove(actorId: string, userId: string): Promise<void> {
    assertNotSelf(actorId, userId, "delete");

    if (!(await this.users.remove(userId))) {
      throw userNotFound();
    }
  }
}
