import type { TransactionExecutor } from "@repo/api-kernel";

/**
 * Auth-facing user persistence port. Owned by the kernel so feature-auth does
 * not need a package dependency on feature-users (users implements this port).
 */
export interface AuthUserRecord {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  avatarUrl: string | null;
  status: "PENDING" | "ACTIVE" | "BLOCKED";
  emailVerifiedAt: Date | null;
  mustChangePassword: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUserCreateInput {
  email: string;
  passwordHash: string;
  displayName: string;
  avatarUrl?: string | null;
  status?: "PENDING" | "ACTIVE" | "BLOCKED";
  emailVerifiedAt?: Date | null;
  mustChangePassword?: boolean;
}

export type AuthUserUpdateInput = Partial<AuthUserCreateInput>;

export interface AuthUserStore {
  create(values: AuthUserCreateInput, executor?: TransactionExecutor): Promise<AuthUserRecord>;
  findById(userId: string, executor?: TransactionExecutor): Promise<AuthUserRecord | null>;
  /** Strong primary read for authentication and authorization decisions. */
  findByIdStrong(userId: string): Promise<AuthUserRecord | null>;
  findByEmail(email: string, executor?: TransactionExecutor): Promise<AuthUserRecord | null>;
  update(
    userId: string,
    values: AuthUserUpdateInput,
    executor?: TransactionExecutor,
  ): Promise<AuthUserRecord | null>;
}

export { AUTH_USER_STORE } from "./auth-user-store.token";
