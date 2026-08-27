import { ROLE_NAMES } from "@repo/feature-access-control/contracts";

/** Audit-export files are tagged with this kind by the export use case. */
export const AUDIT_EXPORT_FILE_KIND = "AUDIT_EXPORT";
/**
 * Whether an actor may download a stored audit-export file.
 *
 * Rules:
 *   1. File must be kind AUDIT_EXPORT.
 *   2. SUPER_ADMIN may download any org's export (including platform-scoped).
 *   3. Everyone else may only download exports for their current organization.
 * Trace: download-audit-export use case / audit ACL e2e.
 */
export function canDownloadAuditExport(input: {
  actorRoles: readonly string[];
  actorOrganizationId: string | null;
  fileKind: string;
  fileOrganizationId: string | null;
}): boolean {
  if (input.fileKind !== AUDIT_EXPORT_FILE_KIND) {
    return false;
  }

  if (input.actorRoles.includes(ROLE_NAMES.SUPER_ADMIN)) {
    return true;
  }

  return (
    input.actorOrganizationId !== null && input.fileOrganizationId === input.actorOrganizationId
  );
}
