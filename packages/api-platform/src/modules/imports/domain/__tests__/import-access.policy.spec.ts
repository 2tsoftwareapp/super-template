import { ROLE_NAMES } from '@repo/api-core';
import { describe, expect, it } from 'vitest';

import { canAccessImportJob } from '../import-access.policy';

const job = {
  createdById: 'user-1',
  organizationId: 'org-1',
};

describe('canAccessImportJob', () => {
  it('allows the creator', () => {
    expect(
      canAccessImportJob({
        actor: {
          userId: 'user-1',
          organizationId: 'org-1',
          roles: [ROLE_NAMES.USER],
        },
        job,
      }),
    ).toBe(true);
  });

  it('denies another USER in the same org', () => {
    expect(
      canAccessImportJob({
        actor: {
          userId: 'user-2',
          organizationId: 'org-1',
          roles: [ROLE_NAMES.USER],
        },
        job,
      }),
    ).toBe(false);
  });

  it('allows ADMIN in the same org', () => {
    expect(
      canAccessImportJob({
        actor: {
          userId: 'admin-1',
          organizationId: 'org-1',
          roles: [ROLE_NAMES.ADMIN],
        },
        job,
      }),
    ).toBe(true);
  });
});
