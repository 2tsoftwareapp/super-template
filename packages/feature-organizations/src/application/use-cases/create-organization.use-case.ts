import type { AuthenticatedRequestUser } from "@repo/api-runtime";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, ERROR_CODES, PLATFORM_TRANSACTION_PORT, type PlatformTransactionPort } from "@repo/api-runtime";
import { ACTIVITY_EMITTER, type ActivityEmitter } from "@repo/feature-activities/contracts";

import type { CreateOrganizationCommand } from "../organizations.types";

import { ORGANIZATION_MEMBERSHIP, type OrganizationMembership } from "../../public/contracts";
import {
  ORGANIZATIONS_REPOSITORY,
  type OrganizationsRepositoryPort,
} from "../ports/organizations.repository.port";

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "organization";

import {
  ORGANIZATION_ACCESS_CONTROL,
  type OrganizationAccessControlPort,
} from "../../public/contracts";

@Injectable()

export class CreateOrganizationUseCase {
  constructor(
    // Creating an organization is a platform-level operation: the new tenant's
    // id is unknown until the insert, so the write cannot run under a request
    // tenant context. The platform transaction runs with RLS bypass so the
    // cross-context activity emit (which references the brand-new org) passes
    // the tenant-isolation policies.
    @Inject(PLATFORM_TRANSACTION_PORT)
    private readonly transactionPort: PlatformTransactionPort,
    @Inject(ORGANIZATIONS_REPOSITORY)
    private readonly organizationsRepository: OrganizationsRepositoryPort,
    @Inject(ORGANIZATION_MEMBERSHIP)
    private readonly membership: OrganizationMembership,
    @Inject(ACTIVITY_EMITTER) private readonly activityEmitter: ActivityEmitter,
    @Inject(ORGANIZATION_ACCESS_CONTROL)
    private readonly accessControl: OrganizationAccessControlPort,
  ) {}

  async execute(user: AuthenticatedRequestUser, input: CreateOrganizationCommand) {
    const baseSlug = slugify(input.name);
    let organization = null;
    let attempt = 0;
    let slug = baseSlug;

    while (attempt < 10) {
      try {
        organization = await this.transactionPort.run(async (transaction) => {
          if (attempt > 0) {
            const randomSuffix = Math.random().toString(36).substring(2, 6);
            slug = `${baseSlug}-${randomSuffix}`;
          }

          const existing = await this.organizationsRepository.findBySlug(slug, transaction);
          if (existing) {
            throw new AppError(
              ERROR_CODES.RESOURCE_CONFLICT,
              "Slug already exists",
              HttpStatus.CONFLICT,
            );
          }

          const created = await this.organizationsRepository.createOrganization(
            {
              name: input.name.trim(),
              slug,
            },
            transaction,
          );

          if (!created) {
            throw new AppError(
              ERROR_CODES.INTERNAL_ERROR,
              "Organization could not be created",
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }

          await this.membership.addMember(
            {
              organizationId: created.id,
              userId: user.userId,
              role: "OWNER",
            },
            transaction,
          );
          await this.accessControl.ensureOrganizationAdminRole(
            created.id,
            user.userId,
            transaction,
          );

          await this.activityEmitter.emit(
            {
              organizationId: created.id,
              summary: `Organization "${created.name}" created`,
              entityType: "organization",
              entityId: created.id,
              actorId: user.userId,
              visibility: "INTERNAL",
            },
            transaction,
          );

          return created;
        });

        break;
      } catch (error) {
        const pgError = error as {
          code?: string;
          message?: string;
          errorCode?: string;
        };
        const isUniqueViolation =
          pgError.code === "23505" ||
          (pgError.message?.includes("unique") ?? false) ||
          pgError.errorCode === ERROR_CODES.RESOURCE_CONFLICT ||
          (pgError.message?.includes("Slug already exists") ?? false);

        if (isUniqueViolation && attempt < 9) {
          attempt += 1;
          continue;
        }
        throw error;
      }
    }

    if (!organization) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        "Organization could not be created after retries",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      role: "OWNER" as const,
      createdAt: organization.createdAt.toISOString(),
      updatedAt: organization.updatedAt.toISOString(),
      current: false,
    };
  }
}
