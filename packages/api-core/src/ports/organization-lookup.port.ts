import type { TransactionExecutor } from '../common/types/transaction-executor';

export interface OrganizationLookup {
  findPrimaryOrganizationId(
    userId: string,
    executor?: TransactionExecutor,
  ): Promise<string | null>;
}

export const ORGANIZATION_LOOKUP = Symbol('ORGANIZATION_LOOKUP');
