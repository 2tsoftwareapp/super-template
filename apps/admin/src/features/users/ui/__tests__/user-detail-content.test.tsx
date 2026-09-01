import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";

import type { UserDetailViewModel } from "@/features/users/model/users.types";
import type { AdminUserDto } from "@/lib/api-types";

import { UserDetailContent } from "../user-detail-content";

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/users/u1",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/features/audit-logs", () => ({
  useAuditLogsQuery: vi.fn().mockReturnValue({
    data: {
      data: [
        {
          id: "audit-1",
          action: "user.login",
          entityType: "User",
          entityId: "u1",
          actorId: "actor-1",
          ipAddress: "127.0.0.1",
          createdAt: "2026-01-01T12:00:00Z",
        },
      ],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    },
    isLoading: false,
    isError: false,
  }),
}));

const mockUser: AdminUserDto = {
  id: "u1",
  email: "alice@example.com",
  displayName: "Alice Wonderland",
  status: "ACTIVE",
  emailVerifiedAt: "2026-01-01T00:00:00Z",
  roles: ["SUPER_ADMIN"],
  roleIds: ["r-super"],
  roleAssignments: [],
  memberOrganizationIds: ["org-1"],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-02T00:00:00Z",
};

function TestWrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function UserDetailTestContainer(props: {
  user?: AdminUserDto;
  flags?: Partial<UserDetailViewModel["flags"]>;
}) {
  const user = props.user ?? mockUser;
  const form = useForm({
    defaultValues: {
      displayName: user.displayName,
      email: user.email,
    },
  });

  const vm: UserDetailViewModel = {
    isLoading: false,
    currentUser: user,
    backHref: "/users",
    onRefresh: vi.fn(),
    isRefreshing: false,
    flags: {
      isSelf: false,
      isActorSuperAdmin: true,
      isTargetPrivileged: true,
      canEdit: true,
      ...props.flags,
    },
    profile: {
      form,
      onSubmit: vi.fn(),
      state: { isPending: false, isSuccess: false, isError: false },
    },
    status: {
      selected: "ACTIVE",
      options: ["PENDING", "ACTIVE", "BLOCKED"],
      disabled: false,
      canApply: false,
      onSelect: vi.fn(),
      onApply: vi.fn(),
      state: { isPending: false, isSuccess: false, isError: false },
    },
    roles: {
      selectedRoleName: "SUPER_ADMIN",
      selectedOrganizationId: "org-1",
      selectedRoleId: "r-super",
      options: [
        {
          id: "r-super",
          name: "SUPER_ADMIN",
          description: "Full platform access",
          organizationId: null,
          scope: "platform",
        },
        {
          id: "r-user",
          name: "USER",
          description: "Standard user access",
          organizationId: null,
          scope: "platform",
        },
      ],
      organizations: [{ id: "org-1", name: "Acme Corp" }],
      needsOrganization: false,
      orgRequired: false,
      membershipExists: true,
      disabled: false,
      isLoading: false,
      organizationsLoading: false,
      canSave: false,
      onOrganizationSelect: vi.fn(),
      onSelect: vi.fn(),
      onSave: vi.fn(),
      state: { isPending: false, isSuccess: false, isError: false },
    },
    danger: {
      confirmOpen: false,
      onOpen: vi.fn(),
      onCancel: vi.fn(),
      onConfirm: vi.fn(),
      state: { isPending: false, isSuccess: false, isError: false },
      onRetry: vi.fn(),
    },
  };

  return (
    <TestWrapper>
      <UserDetailContent vm={vm} user={user} />
    </TestWrapper>
  );
}

describe("UserDetailContent", () => {
  it("renders User Overview with ResourcePropertyGrid fields", () => {
    render(<UserDetailTestContainer />);

    expect(screen.getByText("User Overview")).toBeInTheDocument();
    expect(screen.getByText("User ID")).toBeInTheDocument();
    expect(screen.getByText("Email address")).toBeInTheDocument();
    expect(screen.getAllByText("alice@example.com").length).toBeGreaterThan(0);
    expect(screen.getByText("Account status")).toBeInTheDocument();
    expect(screen.getByText("Email verification")).toBeInTheDocument();
  });

  it("renders Audit & Activity Timeline with events", () => {
    render(<UserDetailTestContainer />);

    expect(screen.getByText("Audit & Activity Timeline")).toBeInTheDocument();
    expect(screen.getByText("USER · LOGIN")).toBeInTheDocument();
  });

  it("renders Role & Access Assignment section", () => {
    render(<UserDetailTestContainer />);

    expect(screen.getByText("Role & Access Assignment")).toBeInTheDocument();
    expect(screen.getAllByText(/super admin/i).length).toBeGreaterThan(0);
  });

  it("renders Danger zone with Delete user button", () => {
    render(<UserDetailTestContainer />);

    expect(screen.getByText("Danger Zone")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete user/i })).toBeInTheDocument();
  });

  it("disables delete when account is own account (isSelf)", () => {
    render(<UserDetailTestContainer flags={{ isSelf: true }} />);

    expect(
      screen.getByText("This is your own account. Status changes and deletion are disabled."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Danger Zone")).not.toBeInTheDocument();
  });
});
