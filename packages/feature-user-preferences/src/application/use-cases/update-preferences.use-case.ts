import type { RequestContext } from "@repo/api-runtime";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, ERROR_CODES, SYSTEM_SCOPE } from "@repo/api-runtime";
import { AUDIT_WRITER, type AuditWriter } from "@repo/feature-audit/contracts";

import type { UpdatePreferencesCommand } from "../preferences.types";

import {
  PREFERENCES_REPOSITORY,
  type PreferencesRepositoryPort,
} from "../ports/preferences.repository.port";
import { PreferencesMapper } from "../preferences.mapper";
import {
  assertValidPreferenceLanguage,
  assertValidPreferenceTheme,
  assertValidTimezone,
} from "../preferences.validation";

@Injectable()
export class UpdatePreferencesUseCase {
  constructor(
    @Inject(PREFERENCES_REPOSITORY)
    private readonly preferencesRepository: PreferencesRepositoryPort,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    private readonly preferencesMapper: PreferencesMapper,
  ) {}

  async execute(userId: string, input: UpdatePreferencesCommand, requestContext?: RequestContext) {
    if (input.theme !== undefined) {
      assertValidPreferenceTheme(input.theme);
    }

    if (input.language !== undefined) {
      assertValidPreferenceLanguage(input.language);
    }

    if (input.timezone !== undefined) {
      assertValidTimezone(input.timezone);
    }

    const updated = await this.preferencesRepository.upsert(userId, {
      ...(input.theme !== undefined ? { theme: input.theme } : {}),
      ...(input.language !== undefined ? { language: input.language } : {}),
      ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
      ...(input.notificationPreferences !== undefined
        ? { notificationPreferences: input.notificationPreferences }
        : {}),
      ...(input.emailPreferences !== undefined ? { emailPreferences: input.emailPreferences } : {}),
    });

    if (!updated) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to update user preferences",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    await this.auditWriter.log({
      actorId: userId,
      action: "user.preferences.updated",
      entityType: "user_preferences",
      entityId: userId,
      requestContext,
      scope: SYSTEM_SCOPE.PLATFORM,
    });

    return this.preferencesMapper.toDto(updated);
  }
}
