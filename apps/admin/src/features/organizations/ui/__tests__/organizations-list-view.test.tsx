import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { OrganizationsListViewModel } from "@/features/organizations/model/organizations.types";
import type { OrganizationDto } from "@/lib/api-types";

import { OrganizationsListView } from "../organizations-list-view";

const mockOrg1: OrganizationDto = {
  id: "org-1",
  name: "Acme Corp",
  slug: "acme-corp",
  role: "OWNER",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

function createMockViewModel(
  overrides?: Partial<OrganizationsListViewModel>,
): OrganizationsListViewModel {
  return {
    search: "",
    onSearchChange: vi.fn(),
    organizations: [mockOrg1],
    isLoading: false,
    isRefreshing: false,
    isError: false,
    onRetry: vi.fn(),
    onRefresh: vi.fn(),
    noResults: false,
    noOrgs: false,
    onNavigate: vi.fn(),
    stats: { total: 1, owner: 1, admin: 0, member: 0 },
    drawer: {
      open: false,
      onOpen: vi.fn(),
      onClose: vi.fn(),
      onCreate: vi.fn(),
      isCreating: false,
    },
    ...overrides,
  };
}

describe("OrganizationsListView", () => {
  it("renders organizations list with CommonResourcePage, search bar, and action button", () => {
    render(<OrganizationsListView {...createMockViewModel()} />);

    expect(screen.getByText("Organizations")).toBeInTheDocument();
    expect(
      screen.getByText("View and manage workspaces, tenants, and membership directories."),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search organizations or slugs...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /new organization/i })).toBeInTheDocument();
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("acme-corp")).toBeInTheDocument();
  });

  it("calls onNavigate when clicking on an organization row", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<OrganizationsListView {...createMockViewModel({ onNavigate })} />);

    const row = screen.getByText("Acme Corp");
    await user.click(row);

    expect(onNavigate).toHaveBeenCalledWith("org-1");
  });

  it("opens create organization drawer when clicking New Organization button", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(
      <OrganizationsListView
        {...createMockViewModel({
          drawer: {
            ...createMockViewModel().drawer,
            onOpen,
          },
        })}
      />,
    );

    const newBtn = screen.getByRole("button", { name: /new organization/i });
    await user.click(newBtn);

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("renders empty state when no organizations exist", () => {
    render(
      <OrganizationsListView
        {...createMockViewModel({
          organizations: [],
          noOrgs: true,
        })}
      />,
    );

    expect(screen.getByText("No organizations yet")).toBeInTheDocument();
  });
});
