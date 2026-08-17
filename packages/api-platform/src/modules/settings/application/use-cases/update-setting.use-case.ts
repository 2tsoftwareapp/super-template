import type { AuthenticatedRequestUser, RequestContext } from "@repo/api-core";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, ERROR_CODES, ROLE_NAMES, SYSTEM_SCOPE } from "@repo/api-core";
import { PLATFORM_TRANSACTION_PORT, type PlatformTransactionPort } from "@repo/api-core";

import type { UpdateSettingCommand } from "../settings.types";

import { AuditService } from "../../../audit/application/audit.service";
import { ApplicationSettingsLookupService } from "../application-settings-lookup.service";
import {
  SETTINGS_REPOSITORY,
  type SettingsRepositoryPort,
} from "../ports/settings.repository.port";
import { SettingsMapper } from "../settings.mapper";

@Injectable()
export class UpdateSettingUseCase {
  constructor(
    @Inject(SETTINGS_REPOSITORY) private readonly settingsRepository: SettingsRepositoryPort,
    private readonly auditService: AuditService,
    @Inject(PLATFORM_TRANSACTION_PORT)
    private readonly platformTransactionPort: PlatformTransactionPort,
    private readonly settingsLookup: ApplicationSettingsLookupService,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    key: string,
    input: UpdateSettingCommand,
    requestContext?: RequestContext,
  ) {
    if (!actor.roles.includes(ROLE_NAMES.SUPER_ADMIN)) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        "Only SUPER_ADMIN can update application settings",
        HttpStatus.FORBIDDEN,
      );
    }

    const updated = await this.platformTransactionPort.run(async (tx) => {
      const setting = await this.settingsRepository.upsert(key, input.value, actor.userId, tx);

      if (!setting) {
        throw new AppError(
          ERROR_CODES.SETTINGS_NOT_FOUND,
          "Setting could not be updated",
          HttpStatus.NOT_FOUND,
        );
      }

      await this.auditService.log(
        {
          actorId: actor.userId,
          action: "settings.updated",
          entityType: "application_setting",
          // application_settings rows are identified by a text key, not a uuid;
          // the entity_id column is uuid-typed so the key is kept in metadata.
          entityId: null,
          metadata: { key },
          requestContext,
          scope: SYSTEM_SCOPE.PLATFORM,
        },
        tx,
      );

      return setting;
    });

    // The lookup service caches flags for a few seconds; invalidate the updated
    // key so guards (maintenance/registration) pick up the change immediately.
    // With Redis this also clears the entry on every other instance.
    await this.settingsLookup.invalidate(key);

    return SettingsMapper.toDto(updated);
  }
}
