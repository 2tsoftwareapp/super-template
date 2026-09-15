import type { ApplicationSettingDto, ListResponse } from "@repo/web-utils/api-types";

import { bffPath } from "@repo/api-contract";
import { webFetch } from "@repo/web-utils/http";

export const settingsApi = {
  list() {
    return webFetch<ListResponse<ApplicationSettingDto>>(bffPath("/api/v1/admin/settings"));
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
