import type { TransactionExecutor } from "@repo/api-kernel";

export interface OrganizationRecord {
  id: string;
  name: string;
  slug: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationsRepositoryPort {
  createOrganization(
    values: { name: string; slug: string },
    executor?: TransactionExecutor,
  ): Promise<OrganizationRecord | null>;

  findBySlug(slug: string, executor?: TransactionExecutor): Promise<OrganizationRecord | null>;

  findById(
    organizationId: string,
    executor?: TransactionExecutor,
  ): Promise<OrganizationRecord | null>;

  listAll(executor?: TransactionExecutor): Promise<OrganizationRecord[]>;

  updateOrganization(
    organizationId: string,
    values: { name: string },
    executor?: TransactionExecutor,
  ): Promise<OrganizationRecord | null>;

  softDeleteOrganization(
    organizationId: string,
    executor?: TransactionExecutor,
  ): Promise<OrganizationRecord | null>;
}

export const ORGANIZATIONS_REPOSITORY = Symbol("ORGANIZATIONS_REPOSITORY");
