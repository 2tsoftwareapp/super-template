import type { JsonObject, TenantContext, TransactionExecutor } from "@repo/api-kernel";

import { Inject, Injectable } from "@nestjs/common";
import { AppError, getTenantContext } from "@repo/api-kernel";
import { ERROR_CODES } from "@repo/api-runtime";

import {
  ACTIVITIES_REPOSITORY,
  type ActivitiesRepositoryPort,
} from "../ports/activities.repository.port";

export interface EmitActivityInput {
  organizationId: string;
  summary: string;
  entityType: string;
  entityId: string;
  actorId?: string | null;
  visibility?: "PUBLIC" | "PRIVATE" | "INTERNAL";
  metadata?: JsonObject | null;
}

/**
 * Fail-closed tenancy guard for activity writes.
 *
 * `organizationId` reaches the emitter as a plain input, so a caller that gets
 * it wrong writes into another tenant's feed — RLS does not catch it when the
 * request bypasses RLS (platform/super callers). The active tenant context is
 * therefore the authority, not the caller:
 *
 * - Org-scoped request (`tenantId` set, not bypassing RLS): the target MUST be
 *   that tenant. A mismatch throws instead of writing cross-tenant.
 * - Platform/super-scoped call (no active organization, or `bypassRls`): the
 *   explicit `organizationId` is honoured on purpose. These are the deliberate
 *   cross-tenant paths — super-admin actions (`createAdminUser` targeting an
 *   arbitrary organization), platform transactions
 *   (`CreateOrganizationUseCase` writes the feed of the organization it just
 *   created), and worker dispatch, which carries the job's own tenant and no
 *   user-driven scope. There is no ambient tenant to check against, so the
 *   caller's explicit target is the only available source of truth.
 */
export function assertActivityOrganizationInTenant(
  organizationId: string,
  tenant: TenantContext | undefined,
): void {
  // Platform/super scope: no active organization to be consistent with.
  if (!tenant?.tenantId || tenant.bypassRls) {
    return;
  }

  if (organizationId !== tenant.tenantId) {
    throw new AppError(
      // Shared transport code: this is an authorization failure, not a new
      // activity-specific vocabulary. Same code the tenant/role guards raise.
      ERROR_CODES.AUTH_FORBIDDEN,
      "Activity organization does not match the active tenant",
      403,
    );
  }
}

@Injectable()
export class EmitActivityUseCase {
  constructor(
    @Inject(ACTIVITIES_REPOSITORY) private readonly activitiesRepository: ActivitiesRepositoryPort,
  ) {}

  async execute(input: EmitActivityInput, executor?: TransactionExecutor) {
    assertActivityOrganizationInTenant(input.organizationId, getTenantContext());

    return this.activitiesRepository.create(
      {
        organizationId: input.organizationId,
        summary: input.summary,
        entityType: input.entityType,
        entityId: input.entityId,
        actorId: input.actorId ?? null,
        visibility: input.visibility ?? "INTERNAL",
        metadata: input.metadata ?? null,
      },
      executor,
    );
  }
}
