import type { TransactionExecutor } from "@repo/api-kernel";

import { Injectable } from "@nestjs/common";
import { AccessControlService } from "@repo/feature-access-control/contracts";

import type { AuthAccessProfile, AuthRoleRef } from "../public/auth-access-profile.port";

/**
 * Sole binding of auth's `AUTH_ACCESS_PROFILE` port: projects the
 * access-control service onto the auth-owned interface. This file is the only
 * place in auth that names `AccessControlService`; the use cases inject the
 * port, so the concrete class can be swapped (or faked) at the composition
 * root without touching them.
 *
 * The `implements` clause is the compile-time parity check: if access-control's
 * signatures drift, this adapter fails to typecheck.
 */
@Injectable()
export class AuthAccessProfileAdapter implements AuthAccessProfile {
  constructor(private readonly accessControlService: AccessControlService) {}

  getAccessProfile(userId: string, organizationId?: string | null) {
    return this.accessControlService.getAccessProfile(userId, organizationId);
  }

  getAccessProfileStrong(userId: string, organizationId?: string | null) {
    return this.accessControlService.getAccessProfileStrong(userId, organizationId);
  }

  async getRoleByName(
    name: string,
    organizationId?: string | null,
    executor?: TransactionExecutor,
  ): Promise<AuthRoleRef | null> {
    return this.accessControlService.getRoleByName(name, organizationId, executor);
  }

  replaceUserRoles(
    userId: string,
    roleIds: string[],
    organizationId: string | null,
    executor?: TransactionExecutor,
  ) {
    return this.accessControlService.replaceUserRoles(userId, roleIds, organizationId, executor);
  }
}
