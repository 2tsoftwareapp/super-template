export interface TenantContext {
  tenantId: string;
  userId: string;
  bypassRls?: boolean;
}

/** Cross-tenant worker dispatch: claim/list due jobs without a request tenant. */
export const WORKER_DISPATCH_CONTEXT: TenantContext = {
  tenantId: '',
  userId: '',
  bypassRls: true,
};

export const tenantContextForJob = (job: {
  organizationId: string | null;
  actorUserId: string | null;
}): TenantContext => ({
  tenantId: job.organizationId ?? '',
  userId: job.actorUserId ?? '',
  bypassRls: false,
});
