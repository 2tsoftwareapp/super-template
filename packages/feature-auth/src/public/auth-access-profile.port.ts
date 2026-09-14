import type { TransactionExecutor } from "@repo/api-kernel";

/** Role projection auth needs — a structural subset of access-control's RoleRecord. */
export interface AuthRoleRef {
  id: string;
  name: string;
  organizationId: string | null;
  isSystem: boolean;
}

/**
 * Consumer-owned port for the access-control operations auth performs
 * (audit finding C-15). It is declared here instead of importing
 * `AccessControlService`, so auth's use cases depend on a shape auth owns and
 * can be driven by a test double; the concrete class is named only in the
 * adapter bound at auth's composition root.
 *
 * Adapter placement: `AuthAccessProfileAdapter` lives in auth's own
 * `infrastructure/` because the feature manifest DAG forbids an
 * `access-control -> auth` import edge (auth already depends on access-control,
 * so a provider-side adapter importing this token would close a cycle that
 * `scripts/check-feature-manifest-deps.mjs` rejects).
 */
export interface AuthAccessProfile {
  getAccessProfile(
    userId: string,
    organizationId?: string | null,
  ): Promise<{ roles: string[]; permissions: string[] }>;

  /** Cache-bypassing read; used where the result authorizes the current request. */
  getAccessProfileStrong(
    userId: string,
    organizationId?: string | null,
  ): Promise<{ roles: string[]; permissions: string[] }>;

  getRoleByName(
    name: string,
    organizationId?: string | null,
    executor?: TransactionExecutor,
  ): Promise<AuthRoleRef | null>;

  replaceUserRoles(
    userId: string,
    roleIds: string[],
    organizationId: string | null,
    executor?: TransactionExecutor,
  ): Promise<unknown>;
}

export { AUTH_ACCESS_PROFILE } from "./auth-access-profile.token";
