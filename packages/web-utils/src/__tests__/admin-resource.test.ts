import { describe, expect, it } from "vitest";

import { composeAdminResources, type AdminResourceConfig } from "../admin-resource";

describe("composeAdminResources", () => {
  it("concatenates feature slices in registration order", () => {
    const identity: AdminResourceConfig<string>[] = [
      {
        id: "users",
        label: "Users",
        group: "People",
        path: "/users",
        icon: "users",
        features: ["list"],
        queryKey: "admin-users",
      },
    ];
    const platform: AdminResourceConfig<string>[] = [
      {
        id: "settings",
        label: "Settings",
        group: "System",
        path: "/settings",
        icon: "settings",
        features: ["list"],
        queryKey: "admin-settings",
      },
    ];

    expect(composeAdminResources([identity, platform]).map((resource) => resource.id)).toEqual([
      "users",
      "settings",
    ]);
  });
});
