import type { AuthenticatedRequestUser, RequestContext } from "@repo/api-core";

import { Inject, Injectable } from "@nestjs/common";
import {
  PLATFORM_TRANSACTION_PORT,
  type PlatformTransactionPort,
  TRANSACTION_PORT,
  type TransactionExecutor,
  type TransactionPort,
} from "@repo/api-core";
import {
  FILE_KIND,
  FILE_VISIBILITY,
  requireOrganizationId,
  ROLE_NAMES,
  SYSTEM_SCOPE,
  toCsv,
} from "@repo/api-core";
import { randomUUID } from "node:crypto";

import type { ExportAuditLogsQuery } from "../audit.types";

import { FILES_REPOSITORY, type FilesRepositoryPort } from "../../../files";
import { OBJECT_STORAGE, type ObjectStorage } from "../../../storage";
import { AUDIT_REPOSITORY, type AuditRepositoryPort } from "../ports/audit.repository.port";
import { RecordAuditLogUseCase } from "./record-audit-log.use-case";

const CSV_HEADER = [
  "id",
  "actorId",
  "action",
  "entityType",
  "entityId",
  "metadata",
  "ipAddress",
  "requestId",
  "createdAt",
];

// Safety bound on a single synchronous export; large historical exports should
// be paginated by date range rather than asking for everything at once.
const MAX_EXPORT_ROWS = 5000;

@Injectable()
export class ExportAuditLogsUseCase {
  constructor(
    @Inject(AUDIT_REPOSITORY) private readonly auditRepository: AuditRepositoryPort,
    @Inject(FILES_REPOSITORY) private readonly filesRepository: FilesRepositoryPort,
    @Inject(OBJECT_STORAGE) private readonly objectStorage: ObjectStorage,
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    @Inject(PLATFORM_TRANSACTION_PORT)
    private readonly platformTransactionPort: PlatformTransactionPort,
    private readonly recordAuditLogUseCase: RecordAuditLogUseCase,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    query: ExportAuditLogsQuery,
    requestContext?: RequestContext,
  ): Promise<{ fileId: string; rowCount: number; totalMatching: number; truncated: boolean }> {
    const isSuperAdmin = actor.roles.includes(ROLE_NAMES.SUPER_ADMIN);

    // SUPER_ADMIN always exports the full trail (including platform-scoped rows
    // recorded without an organization); non-super admins stay scoped to their
    // organization.
    const organizationId = isSuperAdmin ? null : requireOrganizationId(actor);

    const fullQuery = {
      ...query,
      ...(typeof organizationId === "string" ? { organizationId } : {}),
    };

    const runInTx = <T>(fn: (tx: TransactionExecutor) => Promise<T>) => {
      if (organizationId === null) {
        return this.platformTransactionPort.run(fn);
      }
      return this.transactionPort.withTenant(
        { tenantId: organizationId, userId: actor.userId },
        fn,
      );
    };

    const { rows, totalMatching } = await runInTx(async (tx) => {
      const [rowsResult, totalResult] = await Promise.all([
        this.auditRepository.listForExport(
          {
            ...fullQuery,
            limit: MAX_EXPORT_ROWS,
          },
          tx,
        ),
        this.auditRepository.count(fullQuery, tx),
      ]);
      return { rows: rowsResult, totalMatching: totalResult };
    });

    const truncated = totalMatching > MAX_EXPORT_ROWS;

    const csv = toCsv(
      CSV_HEADER,
      rows.map((row) => [
        row.id,
        row.actorId ?? "",
        row.action,
        row.entityType,
        row.entityId ?? "",
        row.metadata ? JSON.stringify(row.metadata) : "",
        row.ipAddress ?? "",
        row.requestId ?? "",
        row.createdAt.toISOString(),
      ]),
    );

    const storageKey = `exports/audit/${randomUUID()}.csv`;
    const body = Buffer.from(csv, "utf8");

    await this.objectStorage.upload({
      key: storageKey,
      body,
      mimeType: "text/csv",
    });

    try {
      const result = await runInTx(async (tx) => {
        const createPayload = {
          organizationId,
          storageKey,
          originalName: `audit-logs-export-${Date.now()}.csv`,
          mimeType: "text/csv",
          sizeBytes: body.length,
          uploadedById: actor.userId,
          kind: FILE_KIND.AUDIT_EXPORT,
          visibility: FILE_VISIBILITY.RESTRICTED,
        };

        const file = await this.filesRepository.create(createPayload, tx);
        if (!file) {
          throw new Error("Audit export file insert returned no rows");
        }

        await this.recordAuditLogUseCase.execute(
          {
            ...(organizationId
              ? { scope: SYSTEM_SCOPE.ORGANIZATION, organizationId }
              : { scope: SYSTEM_SCOPE.PLATFORM }),
            actorId: actor.userId,
            action: "audit.exported",
            entityType: "audit_log",
            metadata: { rowCount: rows.length, fileId: file.id, filters: { ...query } },
            requestContext,
          },
          tx,
        );

        return { fileId: file.id, rowCount: rows.length, totalMatching, truncated };
      });
      return result;
    } catch (error) {
      await this.objectStorage.delete(storageKey).catch((err) => {
        console.error(`Failed to cleanup orphaned export object ${storageKey}:`, err);
      });
      throw error;
    }
  }
}
