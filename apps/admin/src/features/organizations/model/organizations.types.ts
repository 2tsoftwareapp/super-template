import type {
  OrganizationDetailDto,
  OrganizationDto,
  OrganizationMemberDto,
} from "@/lib/api-types";

import type { CreateOrganizationForm } from "./organizations.schemas";

export interface OrganizationSwitcherViewModel {
  organizationId: string | null;
  label: string;
  items: OrganizationDto[];
  isLoading: boolean;
  isSwitching: boolean;
  onSwitch: (organizationId: string) => void;
}

export interface OrganizationsListViewModel {
  search: string;
  onSearchChange: (value: string) => void;
  organizations: OrganizationDto[];
  isLoading: boolean;
  isRefreshing: boolean;
  isError: boolean;
  onRetry: () => void;
  onRefresh: () => void;
  noResults: boolean;
  noOrgs: boolean;
  onNavigate: (orgId: string) => void;
  drawer: {
    open: boolean;
    onOpen: () => void;
    onClose: () => void;
    onCreate: (values: CreateOrganizationForm) => void;
    isCreating: boolean;
  };
}

export interface OrganizationDetailViewModel {
  orgId: string;
  backHref: string;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  org: OrganizationDetailDto | null;
  members: OrganizationMemberDto[];
  membersError: boolean;
  onRetryMembers: () => void;
  actorUserId: string | undefined;
  canRename: boolean;
  canDelete: boolean;
  canLeave: boolean;
  isLastOwner: boolean;
  canManageMember: (member: OrganizationMemberDto) => boolean;
  canDemoteAdminToMember: (member: OrganizationMemberDto) => boolean;
  canPromoteAdminToOwner: (member: OrganizationMemberDto) => boolean;
  canDemoteOwnerToAdmin: (member: OrganizationMemberDto) => boolean;
  editDialog: {
    open: boolean;
    currentName: string;
    onOpen: () => void;
    onClose: () => void;
    onSave: (values: CreateOrganizationForm) => void;
    isSaving: boolean;
  };
  deleteConfirm: {
    open: boolean;
    onOpen: () => void;
    onCancel: () => void;
    onConfirm: () => Promise<void>;
    isPending: boolean;
  };
  leaveConfirm: {
    open: boolean;
    onOpen: () => void;
    onCancel: () => void;
    onConfirm: () => Promise<void>;
    isPending: boolean;
  };
  memberActions: {
    onUpdateRole: (userId: string, role: OrganizationMemberDto["role"]) => void;
    onRemove: (userId: string) => void;
    isUpdatingRole: boolean;
    isRemoving: boolean;
  };
}
