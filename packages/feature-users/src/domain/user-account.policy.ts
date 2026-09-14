import { normalizeEmail } from "@repo/api-kernel";

/**
 * User-account lifecycle rules, stated without the framework so persistence can
 * apply them instead of restating them (ADR 0001).
 *
 * Trace: `UsersRepository` read filters / soft delete, and the account-email
 * uniqueness rule behind the `users_email_active_unique` partial index.
 */

/** Field carrying the soft-delete marker on an account row (`m_users.deleted_at`). */
export const USER_ACCOUNT_SOFT_DELETE_MARKER = "deletedAt" as const;

export const USER_ACCOUNT_STATUS = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  BLOCKED: "BLOCKED",
} as const;

export type UserAccountStatus = (typeof USER_ACCOUNT_STATUS)[keyof typeof USER_ACCOUNT_STATUS];

export interface UserAccountLifecycleState {
  status: string;
  deletedAt: Date | null;
}

/**
 * A live account is one that is not soft-deleted. Every read path (find, list,
 * lookup, existence checks) is scoped to live accounts, mirroring the
 * `deletedAt is null` guard the partial unique index uses for email uniqueness.
 */
export function isActiveUserAccount(account: { deletedAt: Date | null }): boolean {
  return account.deletedAt === null;
}

/**
 * Soft delete is terminal: stamp the marker and park the account in BLOCKED so
 * no leftover status can keep it usable.
 */
export function softDeleteUserAccount(deletedAt: Date): {
  deletedAt: Date;
  status: UserAccountStatus;
} {
  return { deletedAt, status: USER_ACCOUNT_STATUS.BLOCKED };
}

/** Deliverable = live and ACTIVE: the accounts mail/notification fan-out may target. */
export function isDeliverableUserAccount(account: UserAccountLifecycleState): boolean {
  return isActiveUserAccount(account) && account.status === USER_ACCOUNT_STATUS.ACTIVE;
}

/**
 * Identity key an account email is unique on. Reuses the shared-kernel
 * normalizer so the uniqueness rule and every lookup agree on one form.
 */
export function toAccountEmailKey(email: string): string {
  return normalizeEmail(email);
}

/** An email is usable as an account identifier once it normalizes to a value. */
export function isAccountEmailUsable(email: string): boolean {
  return toAccountEmailKey(email).length > 0;
}
