import type { ApplicationSettingDto, ListResponse } from "@/lib/api-types";

import { webFetch } from "@/lib/http";

export async function fetchSettings() {
  return webFetch<ListResponse<ApplicationSettingDto>>("/api/bff/admin/settings");
}

export async function updateSetting(
  key: string,
  value: ApplicationSettingDto["value"],
) {
  return webFetch<{ data: ApplicationSettingDto }>(
    `/api/bff/admin/settings/${key}`,
    {
      method: "PATCH",
      body: JSON.stringify({ value }),
    },
  );
}
