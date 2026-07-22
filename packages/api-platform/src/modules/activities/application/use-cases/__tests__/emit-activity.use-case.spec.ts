import { describe, expect, it, vi } from 'vitest';

import { EmitActivityUseCase } from '../emit-activity.use-case';

describe('EmitActivityUseCase', () => {
  it('applies INTERNAL visibility and null defaults when omitted', async () => {
    const activitiesRepository = { create: vi.fn(async () => ({ id: 'a-1' })) };
    const useCase = new EmitActivityUseCase(activitiesRepository as never);

    await useCase.execute({
      organizationId: 'org-1',
      summary: 'project.created',
      entityType: 'project',
      entityId: 'project-1',
    });

    expect(activitiesRepository.create).toHaveBeenCalledWith(
      {
        organizationId: 'org-1',
        summary: 'project.created',
        entityType: 'project',
        entityId: 'project-1',
        actorId: null,
        visibility: 'INTERNAL',
        metadata: null,
      },
      undefined,
    );
  });

  it('forwards explicit fields and the transaction executor', async () => {
    const activitiesRepository = { create: vi.fn(async () => ({ id: 'a-2' })) };
    const useCase = new EmitActivityUseCase(activitiesRepository as never);
    const executor = { tx: true };

    await useCase.execute(
      {
        organizationId: 'org-1',
        summary: 'project.updated',
        entityType: 'project',
        entityId: 'project-1',
        actorId: 'user-1',
        visibility: 'PUBLIC',
        metadata: { field: 'name' },
      },
      executor as never,
    );

    expect(activitiesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 'user-1',
        visibility: 'PUBLIC',
        metadata: { field: 'name' },
      }),
      executor,
    );
  });
});
