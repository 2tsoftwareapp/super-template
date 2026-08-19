import type { RequestContext } from "@repo/api-core";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import {
  AppError,
  AUDIT_WRITER,
  type AuditWriter,
  ERROR_CODES,
  FILE_LOOKUP,
  type FileLookup,
  SYSTEM_SCOPE,
} from "@repo/api-core";

import type { UpdateProfileCommand, UserView } from "../users.types";

import { USERS_REPOSITORY, type UsersRepositoryPort } from "../ports/users.repository.port";
import { GetUserUseCase } from "./get-user.use-case";

@Injectable()
export class UpdateProfileUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepositoryPort,
    @Inject(FILE_LOOKUP) private readonly fileLookup: FileLookup,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    private readonly getUserUseCase: GetUserUseCase,
  ) {}

  async execute(
    userId: string,
    input: UpdateProfileCommand,
    requestContext?: RequestContext,
  ): Promise<UserView> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND);
    }

    if (input.avatarFileId) {
      const file = await this.fileLookup.findById(input.avatarFileId);

      if (file?.uploadedById !== userId) {
        throw new AppError(
          ERROR_CODES.FILE_NOT_FOUND,
          "Avatar file not found",
          HttpStatus.NOT_FOUND,
        );
      }
    }

    await this.usersRepository.update(userId, {
      displayName: input.displayName ?? user.displayName,
      avatarUrl: input.avatarUrl === undefined ? user.avatarUrl : input.avatarUrl,
      avatarFileId: input.avatarFileId === undefined ? user.avatarFileId : input.avatarFileId,
    });

    await this.auditWriter.log({
      actorId: userId,
      action: "user.profile.updated",
      entityType: "user",
      entityId: userId,
      requestContext,
      scope: SYSTEM_SCOPE.PLATFORM,
    });

    return this.getUserUseCase.execute(userId);
  }
}
