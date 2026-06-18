export interface RoleView {
  id: string;
  name: string;
  description: string | null;
}

export interface AccessProfileView {
  roles: string[];
  permissions: string[];
}
