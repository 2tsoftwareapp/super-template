import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { MergedRole } from "@/features/roles/model/roles.filtering";
import type { RolesViewModel } from "@/features/roles/model/roles.types";

import { RolesListView } from "../roles-list-view";

const mockSystemRole: MergedRole = {
  id: "role-super-admin",
  name: "SUPER_ADMIN",
  description: "Full platform access",
  isSystem: true,
  scope: "platform",
  scopes: ["platform"],
  permissions: [],
  organizationId: null,
};

const mockCustomRole: MergedRole = {
  id: "role-viewer",
  name: "AUDITOR",
  description: "Read-only auditor",
  isSystem: false,
  scope: "organization",
  scopes: ["organization"],
  permissions: [],
  organizationId: "org-1",
};

function createMockViewModel(overrides?: Partial<RolesViewModel>): RolesViewModel {
  return {
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    isSuperAdmin: true,
    search: "",
    onSearchChange: vi.fn(),
    scopeFilter: undefined,
    onScopeFilterChange: vi.fn(),
    organizationFilter: undefined,
    onOrganizationFilterChange: vi.fn(),
    isLoading: false,
    isRefreshing: false,
    isError: false,
    onRetry: vi.fn(),
    onRefresh: vi.fn(),
    systemRoles: [mockSystemRole],
    customRoles: [mockCustomRole],
    anyRoles: true,
    noResults: false,
    deletingRoleId: null,
    isDeleting: false,
    onEditRole: vi.fn(),
    onRequestDelete: vi.fn(),
    pagination: {
      page: 1,
      pageSize: 50,
      totalPages: 1,
      total: 2,
      onPageChange: vi.fn(),
    },
    drawer: {
      open: false,
      editingRole: null,
      permissions: [],
      permissionsError: false,
      isSaving: false,
      onCreate: vi.fn(),
      onClose: vi.fn(),
      onSave: vi.fn(),
    },
    confirmDelete: {
      role: null,
      onCancel: vi.fn(),
      onConfirm: vi.fn().mockResolvedValue(undefined),
    },
    organizations: {
      items: [{ id: "org-1", name: "Acme Corp" }],
      loading: false,
      selectedId: "org-1",
      onSelect: vi.fn(),
    },
    organizationNames: { "org-1": "Acme Corp" },
    actorPermissions: ["roles.create", "roles.update", "roles.delete"],
    ...overrides,
  };
}

describe("RolesListView", () => {
  it("renders roles list with CommonResourcePage, search bar, and system/custom roles", () => {
    render(<RolesListView {...createMockViewModel()} />);

    expect(screen.getByText("Roles")).toBeInTheDocument();
    expect(
      screen.getByText("Create and manage roles with granular permission sets."),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search roles or permissions")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /new role/i })).toBeInTheDocument();
    expect(screen.getByText("System roles")).toBeInTheDocument();
    expect(screen.getByText("Custom roles")).toBeInTheDocument();
  });

  it("calls drawer onCreate when clicking New role button", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    render(
      <RolesListView
        {...createMockViewModel({
          drawer: {
            ...createMockViewModel().drawer,
            onCreate,
          },
        })}
      />,
    );

    const newBtn = screen.getByRole("button", { name: /new role/i });
    await user.click(newBtn);

    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it("renders empty state when no roles match search", () => {
    render(
      <RolesListView
        {...createMockViewModel({
          systemRoles: [],
          customRoles: [],
          noResults: true,
        })}
      />,
    );

    expect(screen.getByText("No roles match your search")).toBeInTheDocument();
  });
});
