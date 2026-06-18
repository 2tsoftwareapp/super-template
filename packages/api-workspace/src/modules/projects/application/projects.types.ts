export type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export type ProjectSortField = 'createdAt' | 'name' | 'status' | 'updatedAt';

export interface ProjectView {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  ownerId: string;
  createdById: string;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ProjectAttachmentView {
  id: string;
  fileId: string;
  entityType: string;
  entityId: string;
  label: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListProjectsQuery {
  page: number;
  limit: number;
  search?: string;
  status?: ProjectStatus;
  sortField: ProjectSortField;
  sortOrder: 'asc' | 'desc';
}

export interface CreateProjectCommand {
  name: string;
  description?: string;
  status?: ProjectStatus;
  ownerId?: string;
}

export interface UpdateProjectCommand {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  ownerId?: string;
}
