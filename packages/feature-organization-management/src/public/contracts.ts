import type { TransactionExecutor } from "@repo/api-kernel";

/**
 * RBAC-aware personal-organization provisioning contract.
 * Inject this directly in features that create users (auth, sso)
 * to ensure organization admin-role assignment happens.
 *
 * The implementation is organization-model aware: in the `org-optional`
 * model it is a no-op (returns null), so callers must treat a null result
 * as "no organization was provisioned" and continue without one.
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
  ): Promise<string | null>;
}

export { PERSONAL_ORGANIZATION_PROVISIONER } from "./personal-organization-provisioner.token";
