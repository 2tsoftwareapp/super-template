import type { TransactionExecutor } from "@repo/api-kernel";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError } from "@repo/api-kernel";
import { ERROR_CODES } from "@repo/api-runtime";

import type { OrganizationMembership } from "../../public/contracts";

import { ORGANIZATION_MEMBERSHIP } from "../../public/organization-membership.token";
import {
  ORGANIZATIONS_REPOSITORY,
  type OrganizationsRepositoryPort,
} from "../ports/organizations.repository.port";

/** Upper bound for a slug, mirroring the slugify truncation. */
const SLUG_MAX_LENGTH = 64;
/** Probe cap, matching the retry budget of create-organization.use-case.ts. */
const SLUG_COLLISION_ATTEMPTS = 10;

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX_LENGTH) || "organization";

/** Short random suffix — the same shape create-organization uses on collision. */
const randomSlugSuffix = (): string => Math.random().toString(36).substring(2, 6);

/** Suffixed candidate that still respects SLUG_MAX_LENGTH. */
const withCollisionSuffix = (baseSlug: string, suffix: string): string =>
  `${baseSlug.slice(0, SLUG_MAX_LENGTH - suffix.length - 1)}-${suffix}`;

/**
 * Core personal-organization creation — no access-control dependency.
 * When RBAC admin-role assignment is needed, the orchestration layer
 * (feature-organization-management) wraps this with access-control calls.
 */
@Injectable()
export class EnsurePersonalOrganizationUseCase {
  constructor(
    @Inject(ORGANIZATIONS_REPOSITORY)
    private readonly organizationsRepository: OrganizationsRepositoryPort,
    @Inject(ORGANIZATION_MEMBERSHIP)
    private readonly membership: OrganizationMembership,
  ) {}

  async execute(userId: string, displayName: string, executor?: TransactionExecutor) {
    const existing = await this.membership.findPrimaryOrganizationId(userId, executor);

    if (existing) {
      return existing;
    }

    const name = `${displayName.trim()}'s Organization`;
    const organization = await this.organizationsRepository.createOrganization(
      {
        name,
        slug: await this.resolveAvailableSlug(
          `${slugify(displayName)}-${userId.slice(0, 8)}`,
          executor,
        ),
      },
      executor,
    );

    if (!organization) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        "Default organization could not be created",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    await this.membership.addMember(
      {
        organizationId: organization.id,
        userId,
        role: "OWNER",
      },
      executor,
    );

    return organization.id;
  }

  /**
   * Pick a slug that is free before inserting.
   *
   * Strategy: the base slug already carries a per-user suffix, so a collision
   * means another organization holds that exact slug. We probe with
   * `findBySlug` and, when taken, retry with a short random suffix — the same
   * strategy and retry budget `create-organization.use-case.ts` uses, so both
   * organization-creation paths behave alike. The loop is bounded so a caller
   * cannot spin forever, and we fail loudly instead of inserting a duplicate.
   * The partial unique index on active slugs stays the last line of defence for
   * a concurrent insert that wins the race after the probe.
   */
  private async resolveAvailableSlug(
    baseSlug: string,
    executor?: TransactionExecutor,
  ): Promise<string> {
    for (let attempt = 0; attempt < SLUG_COLLISION_ATTEMPTS; attempt += 1) {
      const candidate =
        attempt === 0 ? baseSlug : withCollisionSuffix(baseSlug, randomSlugSuffix());
      const taken = await this.organizationsRepository.findBySlug(candidate, executor);

      if (!taken) {
        return candidate;
      }
    }

    throw new AppError(
      ERROR_CODES.INTERNAL_ERROR,
      "Could not allocate a unique organization slug",
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
