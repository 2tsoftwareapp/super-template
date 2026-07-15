import type {
  ListResponse,
  OrganizationDto,
  OrganizationDetailDto,
  OrganizationMemberDto,
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from "@/lib/api-types";

import { webFetch } from "@/lib/http";

export async function fetchMyOrganizations() {
  return webFetch<ListResponse<OrganizationDto>>("/api/bff/organizations");
}

export async function switchOrganization(organizationId: string) {
  return webFetch<{ data: { organizationId: string } }>(
    "/api/auth/switch-organization",
    {
      method: "POST",
      body: JSON.stringify({ organizationId }),
    },
  );
}

export async function fetchOrganizations() {
  return webFetch<ListResponse<OrganizationDto>>("/api/v1/organizations");
}

export async function fetchOrganizationDetail(id: string) {
  return webFetch<{ data: OrganizationDetailDto }>(`/api/v1/organizations/${id}`);
}

export async function createOrganizationApi(input: CreateOrganizationInput) {
  return webFetch<{ data: OrganizationDto }>("/api/v1/organizations", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateOrganizationApi(id: string, input: UpdateOrganizationInput) {
  return webFetch<{ data: OrganizationDetailDto }>(`/api/v1/organizations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteOrganizationApi(id: string) {
  return webFetch<{ data: { success: boolean } }>(`/api/v1/organizations/${id}`, {
    method: "DELETE",
  });
}

export async function leaveOrganizationApi(id: string) {
  return webFetch<{ data: { success: boolean } }>(`/api/v1/organizations/${id}/leave`, {
    method: "POST",
  });
}

export async function fetchOrganizationMembers(id: string) {
  return webFetch<ListResponse<OrganizationMemberDto>>(`/api/v1/organizations/${id}/members`);
}

export async function updateMemberRoleApi(id: string, userId: string, role: string) {
  return webFetch<{ data: OrganizationMemberDto }>(
    `/api/v1/organizations/${id}/members/${userId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ role }),
    },
  );
}

export async function removeMemberApi(id: string, userId: string) {
  return webFetch<{ data: { success: boolean } }>(`/api/v1/organizations/${id}/members/${userId}`, {
    method: "DELETE",
  });
}
