import type { TransactionExecutor } from "@repo/api-kernel";
import type { PlatformTransactionPort } from "@repo/api-kernel";

import { Inject, Injectable } from "@nestjs/common";
import { isJsonObject, redactSensitive, SYSTEM_SCOPE } from "@repo/api-kernel";
import { PLATFORM_TRANSACTION_PORT } from "@repo/api-kernel";

import type { AuditLogInput } from "../../public/audit-writer.port";

import { AUDIT_REPOSITORY, type AuditRepositoryPort } from "../ports/audit.repository.port";

export type AuditInput = AuditLogInput;

@Injectable()
export class RecordAuditLogUseCase {
  constructor(
    @Inject(AUDIT_REPOSITORY) private readonly auditRepository: AuditRepositoryPort,
    @Inject(PLATFORM_TRANSACTION_PORT)
    private readonly platformTransactionPort: PlatformTransactionPort,
  ) {}

  async execute(input: AuditInput, executor?: TransactionExecutor) {
    const { actorId, action, entityType, entityId, metadata, requestContext } = input;

    const basePayload = {
      actorId: actorId ?? null,
      action,
      entityType,
      entityId: entityId ?? null,
      metadata: metadata
        ? (() => {
            const redacted = redactSensitive(metadata);
            return isJsonObject(redacted) ? redacted : null;
          })()
        : null,
      ipAddress: requestContext?.ipAddress ?? null,
      userAgent: requestContext?.userAgent ?? null,
      requestId: requestContext?.requestId ?? null,
    };

    if (input.scope === "organization") {
      return this.auditRepository.create(
        {
          ...basePayload,
          scope: SYSTEM_SCOPE.ORGANIZATION,
          organizationId: input.organizationId,
        },
        executor,
      );
    }

    if (executor) {
      return this.auditRepository.create(
        {
          ...basePayload,
          scope: SYSTEM_SCOPE.PLATFORM,
        },
        executor,
      );
    }

    return this.platformTransactionPort.run((tx) =>
      this.auditRepository.create(
        {
          ...basePayload,
          scope: SYSTEM_SCOPE.PLATFORM,
        },
        tx,
      ),
    );
  }
}
