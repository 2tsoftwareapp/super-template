import { bffPath } from "@repo/api-contract";

import type { ApplicationSettingDto, ListResponse } from "@/lib/api-types";

import { webFetch } from "@/lib/http";

export const settingsApi = {
  list() {
    return webFetch<ListResponse<ApplicationSettingDto>>(
      bffPath("/api/v1/admin/settings"),
    );
  },

  update(key: string, value: ApplicationSettingDto["value"]) {
    return webFetch<{ data: ApplicationSettingDto }>(
      bffPath("/api/v1/admin/settings/{key}", { key }),
      {
        method: "PATCH",
        body: JSON.stringify({ value }),
      },
    );
  },
};

/** @deprecated Prefer `settingsApi` */
export const fetchSettings = () => settingsApi.list();
export const updateSetting = (
  key: string,
  value: ApplicationSettingDto["value"],
) => settingsApi.update(key, value);
