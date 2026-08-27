import type { RequestContext } from "@repo/api-runtime";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, ERROR_CODES, SYSTEM_SCOPE } from "@repo/api-runtime";
import { AUDIT_WRITER, type AuditWriter } from "@repo/feature-audit/contracts";

import {
  PREFERENCES_REPOSITORY,
  type PreferencesRepositoryPort,
} from "../ports/preferences.repository.port";
import { PreferencesMapper } from "../preferences.mapper";

@Injectable()
export class ResetPreferencesUseCase {
  constructor(
    @Inject(PREFERENCES_REPOSITORY)
    private readonly preferencesRepository: PreferencesRepositoryPort,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    private readonly preferencesMapper: PreferencesMapper,
  ) {}

  async execute(userId: string, requestContext?: RequestContext) {
    const reset = await this.preferencesRepository.reset(userId);

    if (!reset) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to reset user preferences",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    await this.auditWriter.log({
      actorId: userId,
      action: "user.preferences.reset",
      entityType: "user_preferences",
      entityId: userId,
      requestContext,
      scope: SYSTEM_SCOPE.PLATFORM,
    });

    return this.preferencesMapper.toDto(reset);
  }
}
