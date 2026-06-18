import type { TransactionExecutor } from '../common/types/transaction-executor';

export interface ProjectDemoRecord {
  id: string;
  name: string;
  description: string | null;
  status: string;
  ownerId: string;
  organizationId: string;
}

export interface ProjectDemoGateway {
  findActiveByOwnerAndName(
    ownerId: string,
    name: string,
    executor?: TransactionExecutor,
  ): Promise<ProjectDemoRecord | null>;
  create(
    values: {
      ownerId: string;
      organizationId: string;
      name: string;
      description: string;
      status: string;
      createdById: string;
    },
    executor?: TransactionExecutor,
  ): Promise<ProjectDemoRecord>;
  list(
    params: {
      organizationId: string;
      page: number;
      limit: number;
      sortOrder: 'asc' | 'desc';
      sortField?: 'createdAt' | 'name' | 'status' | 'updatedAt';
      ownerId?: string;
      search?: string;
      status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
      includeDeleted?: boolean;
    },
    executor?: TransactionExecutor,
  ): Promise<{ rows: ProjectDemoRecord[]; total: number }>;
}

export const PROJECT_DEMO_GATEWAY = Symbol('PROJECT_DEMO_GATEWAY');
