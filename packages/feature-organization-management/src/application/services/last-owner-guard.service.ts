import type { TransactionExecutor } from "@repo/api-kernel";
import type {
  OrganizationMemberRole,
  OrganizationMembership,
} from "@repo/feature-organizations/contracts";

import { Inject, Injectable } from "@nestjs/common";
import { assertNotLastOwner, ORGANIZATION_MEMBERSHIP } from "@repo/feature-organizations/contracts";

/** The member whose OWNER role a membership change puts at risk. */
export interface OwnerChangeTarget {
  userId: string;
  /** Role the member holds right now. */
  currentRole: OrganizationMemberRole;
  /**
   * True when the change leaves the member as an OWNER (e.g. OWNER → OWNER),
   * so the owner count cannot drop and no guard is needed.
   */
  keepsOwnership?: boolean;
}

/**
 * Single home for the "last owner" invariant shared by leave, remove-member and
 * update-member-role: lock the owner rows, count the owners that would remain,
 * assert, then perform the change — all on the caller's transaction, so the
 * lock and the mutation share one transaction boundary. A new membership
 * mutation path must go through this service instead of re-deriving the
 * sequence, which is what let the three copies drift apart.
 */
@Injectable()
export class LastOwnerGuard {
  constructor(
    @Inject(ORGANIZATION_MEMBERSHIP)
    private readonly membership: OrganizationMembership,
  ) {}

  async run<T>(
    organizationId: string,
    target: OwnerChangeTarget,
    executor: TransactionExecutor,
    applyChange: () => Promise<T>,
  ): Promise<T> {
    if (target.currentRole === "OWNER" && !target.keepsOwnership) {
      // `lock: true` takes a row lock on the organization's OWNER rows so a
      // concurrent demotion serializes here rather than both passing the check.
      const remainingOwners = await this.membership.countOwners(organizationId, {
        excludingUserId: target.userId,
        executor,
        lock: true,
      });
      assertNotLastOwner({ userId: target.userId, role: target.currentRole }, remainingOwners);
    }

    return applyChange();
  }
}
