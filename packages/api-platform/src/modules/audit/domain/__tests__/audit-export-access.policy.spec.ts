import { describe, expect, it } from 'vitest';

import { FILE_KIND, ROLE_NAMES } from '@repo/api-core';

import { canDownloadAuditExport } from '../audit-export-access.policy';

describe('canDownloadAuditExport', () => {
  it('rejects non-audit-export kinds', () => {
    expect(
      canDownloadAuditExport({
        actorRoles: [ROLE_NAMES.SUPER_ADMIN],
        actorOrganizationId: null,
        fileKind: 'GENERIC',
        fileOrganizationId: 'org-1',
      }),
    ).toBe(false);
  });

  it('allows SUPER_ADMIN for any organization', () => {
    expect(
      canDownloadAuditExport({
        actorRoles: [ROLE_NAMES.SUPER_ADMIN],
        actorOrganizationId: null,
        fileKind: FILE_KIND.AUDIT_EXPORT,
        fileOrganizationId: 'org-other',
      }),
    ).toBe(true);
  });

  it('allows a tenant admin for their own org export', () => {
    expect(
      canDownloadAuditExport({
        actorRoles: ['ADMIN'],
        actorOrganizationId: 'org-1',
        fileKind: FILE_KIND.AUDIT_EXPORT,
        fileOrganizationId: 'org-1',
      }),
    ).toBe(true);
  });

  it('rejects a tenant admin for another org export', () => {
    expect(
      canDownloadAuditExport({
        actorRoles: ['ADMIN'],
        actorOrganizationId: 'org-1',
        fileKind: FILE_KIND.AUDIT_EXPORT,
        fileOrganizationId: 'org-2',
      }),
    ).toBe(false);
  });
});
