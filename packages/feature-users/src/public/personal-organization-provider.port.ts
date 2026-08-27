import type { TransactionExecutor } from "@repo/api-runtime";

export interface PersonalOrganizationProvider {
  ensurePersonalOrganization(
    userId: string,
    displayName: string,
    executor?: TransactionExecutor,
  ): Promise<unknown>;
}
