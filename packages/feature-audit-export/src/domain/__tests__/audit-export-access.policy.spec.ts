import { PLATFORM_ROLE_NAMES } from "@repo/api-kernel";
import { describe, expect, it } from "vitest";

import { AUDIT_EXPORT_FILE_KIND, canDownloadAuditExport } from "../audit-export-access.policy";

const PLATFORM_SUPER_ADMIN = PLATFORM_ROLE_NAMES.SUPER_ADMIN;

describe("canDownloadAuditExport", () => {
  it("rejects non-audit-export kinds", () => {
    expect(
      canDownloadAuditExport({
        actorRoles: [PLATFORM_SUPER_ADMIN],
        actorOrganizationId: null,
        fileKind: "GENERIC",
        fileOrganizationId: "org-1",
      }),
    ).toBe(false);
  });

  it("allows SUPER_ADMIN for any organization", () => {
    expect(
      canDownloadAuditExport({
        actorRoles: [PLATFORM_SUPER_ADMIN],
        actorOrganizationId: null,
        fileKind: AUDIT_EXPORT_FILE_KIND,
        fileOrganizationId: "org-other",
      }),
    ).toBe(true);
  });

  it("allows a tenant admin for their own org export", () => {
    expect(
      canDownloadAuditExport({
        actorRoles: ["ADMIN"],
        actorOrganizationId: "org-1",
        fileKind: AUDIT_EXPORT_FILE_KIND,
        fileOrganizationId: "org-1",
      }),
    ).toBe(true);
  });

  it("rejects a tenant admin for another org export", () => {
    expect(
      canDownloadAuditExport({
        actorRoles: ["ADMIN"],
        actorOrganizationId: "org-1",
        fileKind: AUDIT_EXPORT_FILE_KIND,
        fileOrganizationId: "org-2",
      }),
    ).toBe(false);
  });
});
