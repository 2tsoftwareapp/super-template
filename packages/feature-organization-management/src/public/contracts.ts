import type { TransactionExecutor } from "@repo/api-runtime";

/**
 * RBAC-aware personal-organization provisioning contract.
 * Inject this directly in features that create users (auth, sso)
 * to ensure organization admin-role assignment happens.
 *
 * This is NOT the same as PERSONAL_ORGANIZATION_PROVIDER from
 * feature-organizations — that one is core-only and does not
 * include RBAC assignment.
 */
export interface PersonalOrganizationProvisioner {
  ensurePersonalOrganization(
    userId: string,
    displayName: string,
    executor?: TransactionExecutor,
  ): Promise<unknown>;
}

export const PERSONAL_ORGANIZATION_PROVISIONER = Symbol("PERSONAL_ORGANIZATION_PROVISIONER");
