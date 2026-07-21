import { bffPath } from "@repo/api-contract";

import type {
  CreateOrganizationInput,
  ListResponse,
  OrganizationDetailDto,
  OrganizationDto,
  OrganizationMemberDto,
  UpdateOrganizationInput,
} from "@/lib/api-types";

import { buildPath, webFetch } from "@/lib/http";

/**
 * Organizations transport. BFF catch-all paths use `bffPath`.
 * Switch-org stays on the dedicated `/api/auth/*` Next route (cookie session).
 */
export const organizationsApi = {
  mine() {
    return webFetch<ListResponse<OrganizationDto>>(
      buildPath(bffPath("/api/v1/organizations"), { memberOnly: true }),
    );
  },

  switch(organizationId: string) {
    return webFetch<{ data: { organizationId: string } }>(
      "/api/auth/switch-organization",
      {
        method: "POST",
        body: JSON.stringify({ organizationId }),
      },
    );
  },

  list() {
    return webFetch<ListResponse<OrganizationDto>>(
      bffPath("/api/v1/organizations"),
    );
  },

  get(id: string) {
    return webFetch<{ data: OrganizationDetailDto }>(
      bffPath("/api/v1/organizations/{id}", { id }),
    );
  },

  create(input: CreateOrganizationInput) {
    return webFetch<{ data: OrganizationDto }>(
      bffPath("/api/v1/organizations"),
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );
  },

  update(id: string, input: UpdateOrganizationInput) {
    return webFetch<{ data: OrganizationDetailDto }>(
      bffPath("/api/v1/organizations/{id}", { id }),
      {
        method: "PATCH",
        body: JSON.stringify(input),
      },
    );
  },

  delete(id: string) {
    return webFetch<{ data: { success: boolean } }>(
      bffPath("/api/v1/organizations/{id}", { id }),
      { method: "DELETE" },
    );
  },

  leave(id: string) {
    return webFetch<{ data: { success: boolean } }>(
      bffPath("/api/v1/organizations/{id}/leave", { id }),
      { method: "POST" },
    );
  },

  members(id: string) {
    return webFetch<ListResponse<OrganizationMemberDto>>(
      bffPath("/api/v1/organizations/{id}/members", { id }),
    );
  },

  updateMemberRole(id: string, userId: string, role: string) {
    return webFetch<{ data: OrganizationMemberDto }>(
      bffPath("/api/v1/organizations/{id}/members/{userId}", { id, userId }),
      {
        method: "PATCH",
        body: JSON.stringify({ role }),
      },
    );
  },

  removeMember(id: string, userId: string) {
    return webFetch<{ data: { success: boolean } }>(
      bffPath("/api/v1/organizations/{id}/members/{userId}", { id, userId }),
      { method: "DELETE" },
    );
  },
};

/** @deprecated Prefer `organizationsApi` */
export const fetchMyOrganizations = () => organizationsApi.mine();
export const switchOrganization = (organizationId: string) =>
  organizationsApi.switch(organizationId);
export const fetchOrganizations = () => organizationsApi.list();
export const fetchOrganizationDetail = (id: string) =>
  organizationsApi.get(id);
export const createOrganizationApi = (input: CreateOrganizationInput) =>
  organizationsApi.create(input);
export const updateOrganizationApi = (
  id: string,
  input: UpdateOrganizationInput,
) => organizationsApi.update(id, input);
export const deleteOrganizationApi = (id: string) =>
  organizationsApi.delete(id);
export const leaveOrganizationApi = (id: string) => organizationsApi.leave(id);
export const fetchOrganizationMembers = (id: string) =>
  organizationsApi.members(id);
export const updateMemberRoleApi = (
  id: string,
  userId: string,
  role: string,
) => organizationsApi.updateMemberRole(id, userId, role);
export const removeMemberApi = (id: string, userId: string) =>
  organizationsApi.removeMember(id, userId);
