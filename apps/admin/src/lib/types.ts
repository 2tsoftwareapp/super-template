export interface SessionUser {
  id: string;
  displayName: string;
  email: string;
  roles: string[];
}

export interface SessionResponse {
  data: {
    user: SessionUser;
    permissions: string[];
  };
}

export interface ProjectRow {
  id: string;
  name: string;
  status: string;
  description?: string | null;
  updatedAt?: string;
}

export interface UserRow {
  id: string;
  displayName: string;
  email: string;
  status: string;
  roles: string[];
  createdAt?: string;
}

export interface ListResponse<T> {
  data: T[];
  meta?: {
    total?: number;
  };
}
