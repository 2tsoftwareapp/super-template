import { type ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { UsersListViewModel } from "@/features/users/model/users.types";
import type { AdminUserDto } from "@/lib/api-types";

import { UsersListView } from "../users-list-view";

const mockColumns: ColumnDef<AdminUserDto, unknown>[] = [
  {
    accessorKey: "displayName",
    header: "Name",
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: (info) => info.getValue(),
  },
];

const mockUser1: AdminUserDto = {
  id: "u1",
  email: "john@example.com",
  displayName: "John Doe",
  status: "ACTIVE",
  emailVerifiedAt: "2026-01-01T00:00:00Z",
  roles: ["USER"],
  roleIds: ["r1"],
  roleAssignments: [],
  memberOrganizationIds: [],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

function UsersListTestContainer(props: {
  vmOverrides?: Partial<UsersListViewModel>;
  users?: AdminUserDto[];
}) {
  const users = props.users ?? [mockUser1];
  const table = useReactTable({
    data: users,
    columns: mockColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const vm: UsersListViewModel = {
    session: { isLoading: false, isError: false },
    header: {
      isLoading: false,
      isFetching: false,
      total: users.length,
      canCreate: true,
      onRefresh: vi.fn(),
      onCreateClick: vi.fn(),
    },
    list: {
      isError: false,
      isLoading: false,
      onRetry: vi.fn(),
      hasFilters: false,
      emptyTitle: "No users found",
      emptyDescription: "Try adjusting your search.",
      onRowClick: vi.fn(),
    },
    toolbar: {
      search: "",
      onSearchChange: vi.fn(),
      onClearFilters: vi.fn(),
      currentStatus: "all",
      onStatusFilter: vi.fn(),
    },
    bulk: {
      canUpdate: true,
      selectedIds: [],
      isMutating: false,
      isActivating: false,
      isBlocking: false,
      onClearSelection: vi.fn(),
      onBulkActivate: vi.fn().mockResolvedValue(undefined),
      onBulkBlock: vi.fn(),
    },
    pagination: {
      page: 1,
      pageSize: 50,
      totalPages: 1,
      total: users.length,
      isFetching: false,
      onPageChange: vi.fn(),
      onPageSizeChange: vi.fn(),
    },
    createDrawer: {
      open: false,
      actorRoles: ["PLATFORM_ADMIN"],
      actorOrganizationId: null,
      assignableRoles: [],
      organizations: [],
      isOrganizationsLoading: false,
      isSaving: false,
      onClose: vi.fn(),
      onSubmit: vi.fn().mockResolvedValue({ data: mockUser1 }),
    },
    confirmBlock: {
      state: null,
      isLoading: false,
      onCancel: vi.fn(),
      onConfirm: vi.fn().mockResolvedValue(undefined),
    },
    table,
    ...props.vmOverrides,
  };

  return <UsersListView {...vm} />;
}

describe("UsersListView", () => {
  it("renders users list with CommonResourcePage, toolbar, table, and pagination", () => {
    render(<UsersListTestContainer />);

    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getByText("1 user")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search name or email")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /new user/i })).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
  });

  it("calls onCreateClick when clicking New user button", async () => {
    const user = userEvent.setup();
    const onCreateClick = vi.fn();
    render(
      <UsersListTestContainer
        vmOverrides={{
          header: {
            isLoading: false,
            isFetching: false,
            total: 1,
            canCreate: true,
            onRefresh: vi.fn(),
            onCreateClick,
          },
        }}
      />,
    );

    const newBtn = screen.getByRole("button", { name: /new user/i });
    await user.click(newBtn);

    expect(onCreateClick).toHaveBeenCalledTimes(1);
  });

  it("renders bulk actions bar when items are selected", () => {
    render(
      <UsersListTestContainer
        vmOverrides={{
          bulk: {
            canUpdate: true,
            selectedIds: ["u1"],
            isMutating: false,
            isActivating: false,
            isBlocking: false,
            onClearSelection: vi.fn(),
            onBulkActivate: vi.fn().mockResolvedValue(undefined),
            onBulkBlock: vi.fn(),
          },
        }}
      />,
    );

    expect(screen.getByText("1 record selected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Activate" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Block" })).toBeInTheDocument();
  });

  it("renders empty state when list is empty", () => {
    render(<UsersListTestContainer users={[]} />);

    expect(screen.getByText("No users found")).toBeInTheDocument();
    expect(screen.getByText("Try adjusting your search.")).toBeInTheDocument();
  });
});
