import type { AuthenticatedRequestUser, RequestContext } from "@repo/api-kernel";
import type { PlatformTransactionPort } from "@repo/api-kernel";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, PLATFORM_ROLE_NAMES, SYSTEM_SCOPE } from "@repo/api-kernel";
import { PLATFORM_TRANSACTION_PORT } from "@repo/api-kernel";
import { ERROR_CODES } from "@repo/api-runtime";
import { AUDIT_WRITER, type AuditWriter } from "@repo/feature-audit/contracts";
import { SETTINGS_ERROR_CODES } from "@repo/feature-settings/contracts";

import type { UpdateSettingCommand } from "../settings.types";

import { SettingsRepository } from "../../infrastructure/settings.repository";
import { ApplicationSettingsLookupService } from "../application-settings-lookup.service";
import { getSettingDefinition } from "../setting-definitions";
import { SettingsMapper } from "../settings.mapper";

@Injectable()
export class UpdateSettingUseCase {
  constructor(
    private readonly settingsRepository: SettingsRepository,
    @Inject(AUDIT_WRITER)
    private readonly auditWriter: AuditWriter,
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
    if (!actor.roles.includes(PLATFORM_ROLE_NAMES.SUPER_ADMIN)) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        "Only SUPER_ADMIN can update application settings",
        HttpStatus.FORBIDDEN,
      );
    }

    // Registry validation is the single write gate for known keys: an invalid
    // value must never reach the store, otherwise lookups would fall back to
    // their safe default and silently ignore the operator's intent. Unknown
    // keys stay free-form (template extension point) and are not validated.
    getSettingDefinition(key)?.validate(input.value);

    const updated = await this.platformTransactionPort.run(async (tx) => {
      const setting = await this.settingsRepository.upsert(key, input.value, actor.userId, tx);

      if (!setting) {
        throw new AppError(
          SETTINGS_ERROR_CODES.SETTINGS_NOT_FOUND,
          "Setting could not be updated",
          HttpStatus.NOT_FOUND,
        );
      }

      await this.auditWriter.log(
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

      // Drop the cached flag before the commit, so the window in which a reader
      // can still hold the previous value is as short as possible. Invalidating
      // is idempotent and only ever removes data: if this transaction rolls
      // back, the cache is simply empty and readers fall back to the unchanged
      // row — a wasted read, never a wrong answer. (Writing the new value into
      // the cache here would be wrong for exactly that reason.)
      await this.settingsLookup.invalidate(key);

      return setting;
    });

    // Clear again after the commit: a reader that started before the commit may
    // have re-filled the cache from the pre-commit row between the invalidate
    // above and the commit itself. With Redis this also clears the entry on
    // every other instance.
    await this.settingsLookup.invalidate(key);

    return SettingsMapper.toDto(updated);
  }
}
