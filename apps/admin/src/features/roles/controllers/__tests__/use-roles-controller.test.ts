import { act, renderHook, waitFor } from "@testing-library/react";
import { useSearchParams } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { usePathname, useRouter } from "@/i18n/navigation";

import { useRolesController } from "../use-roles-controller";

vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(),
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
}));

vi.mock("@/hooks/use-session", () => ({
  useSession: vi.fn(() => ({
    data: {
      data: {
        permissions: [
          "roles.read",
          "roles.create",
          "roles.update",
          "roles.delete",
        ],
        user: { roles: [] },
      },
    },
  })),
}));

vi.mock("@/features/roles/api/roles.queries", () => ({
  useRolesQuery: vi.fn(() => ({
    data: { data: [], meta: { total: 0, totalPages: 1 } },
    isLoading: false,
    isFetching: false,
    isError: false,
  })),
  usePermissionCatalogQuery: vi.fn(() => ({
    data: { data: [] },
    isFetching: false,
    isError: false,
  })),
}));

vi.mock("@/features/roles/api/roles.mutations", () => ({
  useSaveRoleMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useDeleteRoleMutation: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

vi.mock("@/features/organizations", () => ({
  useOrganizationsQuery: vi.fn(() => ({
    data: { data: [] },
    isLoading: false,
  })),
}));

const asRouter = (replace: ReturnType<typeof vi.fn>) =>
  ({ replace }) as unknown as ReturnType<typeof useRouter>;

const asSearchParams = (searchParams: URLSearchParams) =>
  searchParams as unknown as ReturnType<typeof useSearchParams>;

const mockNavigation = (
  searchParams: URLSearchParams,
  replace: ReturnType<typeof vi.fn>,
) => {
  vi.mocked(useRouter).mockReturnValue(asRouter(replace));
  vi.mocked(usePathname).mockReturnValue("/admin/roles");
  vi.mocked(useSearchParams).mockReturnValue(asSearchParams(searchParams));
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useRolesController", () => {
  it("resets page to 1 when scope filter changes", () => {
    const replace = vi.fn();
    mockNavigation(new URLSearchParams("?page=3"), replace);

    const { result } = renderHook(() => useRolesController());

    act(() => {
      result.current.onScopeFilterChange("organization");
    });

    expect(replace).toHaveBeenCalledWith("/admin/roles?scope=organization");
  });

  it("resets page to 1 when organization filter changes", () => {
    const replace = vi.fn();
    mockNavigation(new URLSearchParams("?page=2"), replace);

    const { result } = renderHook(() => useRolesController());

    act(() => {
      result.current.onOrganizationFilterChange("org-123");
    });

    expect(replace).toHaveBeenCalledWith(
      "/admin/roles?organizationId=org-123",
    );
  });

  it("synchronizes search state when browser navigation changes the URL", async () => {
    const replace = vi.fn();
    let currentSearchParams = new URLSearchParams("?search=alpha");

    vi.mocked(useRouter).mockReturnValue(asRouter(replace));
    vi.mocked(usePathname).mockReturnValue("/admin/roles");
    vi.mocked(useSearchParams).mockImplementation(() =>
      asSearchParams(currentSearchParams),
    );

    const { result, rerender } = renderHook(() => useRolesController());

    expect(result.current.search).toBe("alpha");

    currentSearchParams = new URLSearchParams("?search=beta");
    rerender();

    await waitFor(() => {
      expect(result.current.search).toBe("beta");
    });
    expect(replace).not.toHaveBeenCalled();
  });

  it("debounces user search changes into the URL", async () => {
    const replace = vi.fn();
    mockNavigation(new URLSearchParams(), replace);

    const { result } = renderHook(() => useRolesController());

    act(() => {
      result.current.onSearchChange("security admin");
    });

    expect(result.current.search).toBe("security admin");
    expect(replace).not.toHaveBeenCalled();

    await waitFor(
      () => {
        expect(replace).toHaveBeenCalledWith(
          "/admin/roles?search=security+admin",
        );
      },
      { timeout: 1_000 },
    );
  });
});
