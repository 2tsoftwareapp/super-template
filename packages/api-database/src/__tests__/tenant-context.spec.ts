import { describe, expect, it, vi } from 'vitest';

import type { DatabaseExecutor } from '../database.types';

import {
  setTenantContextOnExecutor,
  setTenantContextOnPgClient,
  tenantContextForJob,
  WORKER_DISPATCH_CONTEXT,
} from '../tenant-context';

describe('tenantContextForJob', () => {
  it('maps a job with an organization and actor', () => {
    expect(
      tenantContextForJob({ organizationId: 'org-1', actorUserId: 'user-1' }),
    ).toEqual({ tenantId: 'org-1', userId: 'user-1', bypassRls: false });
  });

  it('falls back to empty strings when the job has no tenant or actor', () => {
    expect(
      tenantContextForJob({ organizationId: null, actorUserId: null }),
    ).toEqual({ tenantId: '', userId: '', bypassRls: false });
  });
});

describe('WORKER_DISPATCH_CONTEXT', () => {
  it('bypasses RLS for cross-tenant worker dispatch', () => {
    expect(WORKER_DISPATCH_CONTEXT).toEqual({
      tenantId: '',
      userId: '',
      bypassRls: true,
    });
  });
});

describe('setTenantContextOnExecutor', () => {
  it('issues set_config for tenant id, user id, and bypass flag', async () => {
    const execute = vi.fn().mockResolvedValue(undefined);
    const executor = { execute } as unknown as DatabaseExecutor;

    await setTenantContextOnExecutor(executor, {
      tenantId: 'org-1',
      userId: 'user-1',
      bypassRls: true,
    });

    expect(execute).toHaveBeenCalledTimes(3);
  });
});

describe('setTenantContextOnPgClient', () => {
  it('sets all three GUCs with parameterized queries', async () => {
    const query = vi.fn().mockResolvedValue(undefined);
    const client = { query } as never;

    await setTenantContextOnPgClient(client, {
      tenantId: 'org-1',
      userId: 'user-1',
      bypassRls: false,
    });

    expect(query).toHaveBeenCalledTimes(3);
    expect(query).toHaveBeenNthCalledWith(
      1,
      "select set_config('app.tenant_id', $1, false)",
      ['org-1'],
    );
    expect(query).toHaveBeenNthCalledWith(
      3,
      "select set_config('app.bypass_rls', $1, false)",
      ['false'],
    );
  });

  it('defaults to empty/false when no context is provided', async () => {
    const query = vi.fn().mockResolvedValue(undefined);
    const client = { query } as never;

    await setTenantContextOnPgClient(client);

    expect(query).toHaveBeenNthCalledWith(
      1,
      "select set_config('app.tenant_id', $1, false)",
      [''],
    );
  });
});
