import type { TransactionExecutor } from '../common/types/transaction-executor';

export interface ProjectSummary {
  id: string;
  organizationId: string;
  ownerId: string;
}

export interface ProjectLookup {
  findById(
    projectId: string,
    executor?: TransactionExecutor,
  ): Promise<ProjectSummary | null>;
}

export const PROJECT_LOOKUP = Symbol('PROJECT_LOOKUP');
