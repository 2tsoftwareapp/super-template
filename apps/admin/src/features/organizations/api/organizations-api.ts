import type { ListResponse, OrganizationDto } from "@/lib/api-types";

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
