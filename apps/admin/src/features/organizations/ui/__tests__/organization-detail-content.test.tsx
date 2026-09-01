import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { OrganizationDetailViewModel } from "@/features/organizations/model/organizations.types";
import type { OrganizationDetailDto, OrganizationMemberDto } from "@/lib/api-types";

import { OrganizationDetailContent } from "../organization-detail-content";

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/organizations/org-1",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockOrg: OrganizationDetailDto = {
  id: "org-1",
  name: "Acme Corp",
  slug: "acme-corp",
  role: "OWNER",
  memberCount: 3,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-02T00:00:00Z",
};

const mockMembers: OrganizationMemberDto[] = [
  {
    userId: "u-owner",
    displayName: "Alice Owner",
    email: "alice@acme.com",
    role: "OWNER",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    userId: "u-admin",
    displayName: "Bob Admin",
    email: "bob@acme.com",
    role: "ADMIN",
    createdAt: "2026-01-02T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
  },
  {
    userId: "u-member",
    displayName: "Charlie Member",
    email: "charlie@acme.com",
    role: "MEMBER",
    createdAt: "2026-01-03T00:00:00Z",
    updatedAt: "2026-01-03T00:00:00Z",
  },
];

function createMockDetailViewModel(
  overrides?: Partial<OrganizationDetailViewModel>,
): OrganizationDetailViewModel {
  return {
    orgId: "org-1",
    backHref: "/organizations",
    isLoading: false,
    isError: false,
    onRetry: vi.fn(),
    org: mockOrg,
    members: mockMembers,
    membersError: false,
    onRetryMembers: vi.fn(),
    actorUserId: "u-owner",
    canRename: true,
    canDelete: true,
    canLeave: true,
    isLastOwner: false,
    canManageMember: (member) => member.userId !== "u-owner",
    canDemoteAdminToMember: (member) => member.role === "ADMIN",
    canPromoteAdminToOwner: (member) => member.role === "ADMIN",
    canDemoteOwnerToAdmin: () => false,
    editDialog: {
      open: false,
      currentName: "Acme Corp",
      onOpen: vi.fn(),
      onClose: vi.fn(),
      onSave: vi.fn(),
      isSaving: false,
    },
    deleteConfirm: {
      open: false,
      onOpen: vi.fn(),
      onCancel: vi.fn(),
      onConfirm: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    },
    leaveConfirm: {
      open: false,
      onOpen: vi.fn(),
      onCancel: vi.fn(),
      onConfirm: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    },
    memberActions: {
      onUpdateRole: vi.fn(),
      onRemove: vi.fn(),
      isUpdatingRole: false,
      isRemoving: false,
    },
    ...overrides,
  };
}

describe("OrganizationDetailContent", () => {
  it("renders workspace information and members directory", () => {
    const vm = createMockDetailViewModel();
    render(<OrganizationDetailContent {...vm} />);

    expect(screen.getByText("Workspace Information")).toBeInTheDocument();
    expect(screen.getByText("Slug identifier")).toBeInTheDocument();
    expect(screen.getByText("acme-corp")).toBeInTheDocument();
    expect(screen.getByText("Members Directory")).toBeInTheDocument();
    expect(screen.getByText("Alice Owner")).toBeInTheDocument();
    expect(screen.getByText("Bob Admin")).toBeInTheDocument();
    expect(screen.getByText("Charlie Member")).toBeInTheDocument();
  });

  it("renders member role badges correctly", () => {
    const vm = createMockDetailViewModel();
    render(<OrganizationDetailContent {...vm} />);

    expect(screen.getByText("owner")).toBeInTheDocument();
    expect(screen.getByText("admin")).toBeInTheDocument();
    expect(screen.getByText("member")).toBeInTheDocument();
  });

  it("renders role management action buttons for manageable members", () => {
    const vm = createMockDetailViewModel();
    render(<OrganizationDetailContent {...vm} />);

    expect(screen.getByRole("button", { name: /make owner/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /demote to member/i })).toBeInTheDocument();
  });

  it("calls member role update when clicking Make Owner", async () => {
    const user = userEvent.setup();
    const vm = createMockDetailViewModel();
    render(<OrganizationDetailContent {...vm} />);

    const makeOwnerBtn = screen.getByRole("button", { name: /make owner/i });
    await user.click(makeOwnerBtn);

    expect(vm.memberActions.onUpdateRole).toHaveBeenCalledWith("u-admin", "OWNER");
  });

  it("opens delete modal when clicking Delete button", async () => {
    const user = userEvent.setup();
    const vm = createMockDetailViewModel();
    render(<OrganizationDetailContent {...vm} />);

    const deleteBtn = screen.getByRole("button", { name: /delete/i });
    await user.click(deleteBtn);

    expect(vm.deleteConfirm.onOpen).toHaveBeenCalled();
  });
});
