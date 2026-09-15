import type { TransactionExecutor } from "@repo/api-kernel";

/**
 * Consumer-owned port for the organization context auth resolves on every
 * sign-in / refresh / organization switch (audit finding C-15). Declared here
 * instead of importing `OrganizationsService`, so auth's use cases depend on a
 * shape auth owns; the concrete service is named only in the adapter bound at
 * auth's composition root (see `AUTH_ACCESS_PROFILE` for the manifest-DAG
 * reason the adapter cannot live on the organizations side).
 */
export interface AuthOrganizationContext {
  /** Returns the requested organization when the user is a member, else the primary one. */
  resolveOrganizationIdForUser(
    userId: string,
    organizationId?: string | null,
    executor?: TransactionExecutor,
  ): Promise<string | null>;

  /** Throws when the user is not a member of the organization. */
  assertMembership(
    organizationId: string,
    userId: string,
    executor?: TransactionExecutor,
  ): Promise<void>;
}

export { AUTH_ORGANIZATION_CONTEXT } from "./auth-organization-context.token";
