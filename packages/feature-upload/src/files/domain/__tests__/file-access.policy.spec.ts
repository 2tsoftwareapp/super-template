import { FILE_KIND, FILE_VISIBILITY } from "../../../constants/file.constants";
import { ACTION, perm } from "@repo/api-runtime";
import { ROLE_NAMES } from "@repo/feature-access-control/contracts";
import { describe, expect, it } from "vitest";

import { canAccessFile, listFilesAccessScope } from "../file-access.policy";

const orgFile = {
  organizationId: "org-1",
  uploadedById: "user-1",
  kind: FILE_KIND.DEFAULT,
  visibility: FILE_VISIBILITY.PRIVATE,
};

describe("canAccessFile", () => {
  it("allows the uploader", () => {
    expect(
      canAccessFile({
        actor: {
          userId: "user-1",
          organizationId: "org-1",
          roles: [ROLE_NAMES.USER],
          permissions: [perm("files", ACTION.READ)],
        },
        file: orgFile,
      }),
    ).toBe(true);
  });

  it("denies another USER in the same org", () => {
    expect(
      canAccessFile({
        actor: {
          userId: "user-2",
          organizationId: "org-1",
          roles: [ROLE_NAMES.USER],
          permissions: [perm("files", ACTION.READ)],
        },
        file: orgFile,
      }),
    ).toBe(false);
  });

  it("allows ADMIN in the same org", () => {
    expect(
      canAccessFile({
        actor: {
          userId: "admin-1",
          organizationId: "org-1",
          roles: [ROLE_NAMES.ADMIN],
          permissions: [perm("files", ACTION.READ)],
        },
        file: orgFile,
      }),
    ).toBe(true);
  });

  it("requires audit.read for RESTRICTED files", () => {
    expect(
      canAccessFile({
        actor: {
          userId: "admin-1",
          organizationId: "org-1",
          roles: [ROLE_NAMES.ADMIN],
          permissions: [perm("files", ACTION.READ)],
        },
        file: { ...orgFile, visibility: FILE_VISIBILITY.RESTRICTED },
      }),
    ).toBe(false);

    expect(
      canAccessFile({
        actor: {
          userId: "admin-1",
          organizationId: "org-1",
          roles: [ROLE_NAMES.ADMIN],
          permissions: [perm("files", ACTION.READ), perm("audit", ACTION.READ)],
        },
        file: { ...orgFile, visibility: FILE_VISIBILITY.RESTRICTED },
      }),
    ).toBe(true);
  });
});

describe("listFilesAccessScope", () => {
  it("scopes USER lists to their own uploads", () => {
    expect(
      listFilesAccessScope({
        userId: "user-1",
        organizationId: "org-1",
        roles: [ROLE_NAMES.USER],
        permissions: [perm("files", ACTION.READ)],
      }),
    ).toEqual({
      excludeKinds: [FILE_KIND.AUDIT_EXPORT],
      excludeVisibilities: [FILE_VISIBILITY.RESTRICTED],
      uploadedById: "user-1",
    });
  });

  it("lets ADMIN list org files without uploader filter", () => {
    expect(
      listFilesAccessScope({
        userId: "admin-1",
        organizationId: "org-1",
        roles: [ROLE_NAMES.ADMIN],
        permissions: [perm("files", ACTION.READ), perm("audit", ACTION.READ)],
      }),
    ).toEqual({
      excludeKinds: [FILE_KIND.AUDIT_EXPORT],
    });
  });
});
