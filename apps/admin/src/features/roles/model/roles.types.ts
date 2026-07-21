import type { MergedRole } from "@/features/roles/model/roles.filtering";
import type {
  EditableRole,
  ManagedRoleDto,
  PermissionDto,
} from "@/features/roles/model/roles.schemas";

export interface RolesViewModel {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  isSuperAdmin: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  isLoading: boolean;
  isRefreshing: boolean;
  isError: boolean;
  onRetry: () => void;
  onRefresh: () => void;
  systemRoles: MergedRole[];
  customRoles: MergedRole[];
  anyRoles: boolean;
  noResults: boolean;
  deletingRoleId: string | null;
  isDeleting: boolean;
  onEditRole: (role: ManagedRoleDto) => void;
  onRequestDelete: (role: ManagedRoleDto) => void;
  drawer: {
    open: boolean;
    editingRole: EditableRole | null;
    permissions: PermissionDto[];
    permissionsError: boolean;
    isSaving: boolean;
    onCreate: () => void;
    onClose: () => void;
    onSave: (values: {
      name: string;
      description: string;
      permissionIds: string[];
      organizationId: string;
    }) => void;
  };
  confirmDelete: {
    role: ManagedRoleDto | null;
    onCancel: () => void;
    onConfirm: () => Promise<void>;
  };
  organizations: {
    items: { id: string; name: string }[];
    loading: boolean;
    selectedId: string;
    onSelect: (id: string) => void;
  };
  organizationNames: Record<string, string>;
  actorPermissions: string[];
}
