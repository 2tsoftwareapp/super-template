import { describe, expect, it } from "vitest";

import { selectNotificationPermissions } from "../notifications.permissions";

describe("notifications.permissions", () => {
  it("grants all with notifications.create", () => {
    expect(selectNotificationPermissions(["notifications.create", "notifications.read"])).toEqual({
      canRead: true,
      canSend: true,
      canCancel: true,
    });
  });

  it("cancel follows create permission", () => {
    expect(selectNotificationPermissions(["notifications.read"])).toEqual({
      canRead: true,
      canSend: false,
      canCancel: false,
    });
  });

  it("returns false for empty permissions", () => {
    expect(selectNotificationPermissions(undefined)).toEqual({
      canRead: false,
      canSend: false,
      canCancel: false,
    });
  });
});
