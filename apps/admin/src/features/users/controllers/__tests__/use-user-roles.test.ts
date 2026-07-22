import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { AdminUserDto } from "@/lib/api-types";

import { type RoleOption, useUserRoles } from "../use-user-roles";

const roles: RoleOption[] = [
  {
    id: "role-accountant",
    name: "ACCOUNTANT",
    description: null,
    organizationId: "org-a",
    scope: "organization",
  },
  {
    id: "role-user",
    name: "USER",
    description: null,
    organizationId: null,
    scope: "platform",
  },
];

const replaceRoles = {
  isPending: false,
  isSuccess: false,
  isError: false,
  mutateAsync: vi.fn(() => Promise.resolve(undefined)),
};

function user(overrides: Partial<AdminUserDto>): AdminUserDto {
  return {
    id: "user-1",
    email: "user@example.com",
    displayName: "User",
    avatarUrl: null,
    status: "ACTIVE",
    emailVerifiedAt: null,
    roles: [],
    roleIds: [],
    roleAssignments: [],
    memberOrganizationIds: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  } as AdminUserDto;
}

describe("useUserRoles", () => {
  it("hydrates the selected organization when user detail arrives after initial render", async () => {
    const { result, rerender } = renderHook(
      ({ currentUser, initialOrganizationId }) =>
        useUserRoles(
          "user-1",
          currentUser,
          replaceRoles,
          true,
          null,
          false,
          false,
          roles,
          [{ id: "org-a", name: "Org A" }],
          false,
          initialOrganizationId,
        ),
      {
        initialProps: {
          currentUser: null as AdminUserDto | null,
          initialOrganizationId: null as string | null,
        },
      },
    );

    expect(result.current.selectedOrganizationId).toBe("");

    rerender({
      currentUser: user({
        roleAssignments: [
          {
            roleId: "role-accountant",
            roleName: "ACCOUNTANT",
            organizationId: "org-a",
          },
        ],
        memberOrganizationIds: ["org-a"],
      }),
      initialOrganizationId: "org-a",
    });

    await waitFor(() => {
      expect(result.current.selectedOrganizationId).toBe("org-a");
      expect(result.current.selectedRoleId).toBe("role-accountant");
      expect(result.current.canSave).toBe(false);
    });
  });

  it("uses actor organization scope once the session hydrates", async () => {
    const currentUser = user({
      roleAssignments: [
        {
          roleId: "role-accountant",
          roleName: "ACCOUNTANT",
          organizationId: "org-a",
        },
      ],
      memberOrganizationIds: ["org-a"],
    });

    const { result, rerender } = renderHook(
      ({ actorOrganizationId }) =>
        useUserRoles(
          "user-1",
          currentUser,
          replaceRoles,
          false,
          actorOrganizationId,
          false,
          false,
          roles,
          [],
          false,
          actorOrganizationId,
        ),
      {
        initialProps: {
          actorOrganizationId: null as string | null,
        },
      },
    );

    rerender({ actorOrganizationId: "org-a" });

    await waitFor(() => {
      expect(result.current.selectedRoleId).toBe("role-accountant");
      expect(result.current.membershipExists).toBe(true);
      expect(result.current.canSave).toBe(false);
    });
  });

  it("does not treat platform USER membership as an unsaved role change", async () => {
    const { result } = renderHook(() =>
      useUserRoles(
        "user-1",
        user({
          roleAssignments: [],
          memberOrganizationIds: ["org-a"],
        }),
        replaceRoles,
        false,
        "org-a",
        false,
        false,
        roles,
        [],
        false,
        "org-a",
      ),
    );

    await waitFor(() => {
      expect(result.current.selectedRoleId).toBe("role-user");
      expect(result.current.canSave).toBe(false);
    });
  });
});
