import { describe, expect, it, vi } from 'vitest';

import { AppError, ERROR_CODES } from '@repo/api-core';

import { AddJobDependencyUseCase } from './add-job-dependency.use-case';

const job = (overrides: Partial<{ id: string; status: string; organizationId: string | null }> = {}) => ({
  id: 'job-1',
  status: 'PENDING' as const,
  organizationId: 'org-1',
  ...overrides,
});

describe('AddJobDependencyUseCase', () => {
  it('rejects a job depending on itself without querying the cycle check', async () => {
    const jobsRepository = { findById: vi.fn() };
    const jobObservabilityRepository = {
      wouldCreateCycle: vi.fn(),
      addDependency: vi.fn(),
    };

    const useCase = new AddJobDependencyUseCase(
      jobsRepository as never,
      jobObservabilityRepository as never,
    );

    await expect(useCase.execute('job-1', 'job-1')).rejects.toMatchObject({ code: ERROR_CODES.JOB_DEPENDENCY_CYCLE });

    expect(jobsRepository.findById).not.toHaveBeenCalled();
    expect(jobObservabilityRepository.wouldCreateCycle).not.toHaveBeenCalled();
  });

  it('rejects when either job does not exist', async () => {
    const jobsRepository = {
      findById: vi.fn(async (id: string) => (id === 'job-1' ? job() : null)),
    };
    const jobObservabilityRepository = {
      wouldCreateCycle: vi.fn(),
      addDependency: vi.fn(),
    };

    const useCase = new AddJobDependencyUseCase(
      jobsRepository as never,
      jobObservabilityRepository as never,
    );

    await expect(useCase.execute('job-1', 'job-missing')).rejects.toMatchObject({ code: ERROR_CODES.JOB_NOT_FOUND });
  });

  it('rejects when the new edge would create a cycle', async () => {
    const jobsRepository = {
      findById: vi.fn(async (id: string) => job({ id })),
    };
    const jobObservabilityRepository = {
      wouldCreateCycle: vi.fn(async () => true),
      addDependency: vi.fn(),
    };

    const useCase = new AddJobDependencyUseCase(
      jobsRepository as never,
      jobObservabilityRepository as never,
    );

    await expect(useCase.execute('job-1', 'job-2')).rejects.toMatchObject({ code: ERROR_CODES.JOB_DEPENDENCY_CYCLE });
    expect(jobObservabilityRepository.addDependency).not.toHaveBeenCalled();
  });

  it('creates the dependency when valid', async () => {
    const jobsRepository = {
      findById: vi.fn(async (id: string) =>
        job({ id, status: id === 'job-2' ? 'COMPLETED' : 'PENDING' }),
      ),
    };
    const jobObservabilityRepository = {
      wouldCreateCycle: vi.fn(async () => false),
      addDependency: vi.fn(async () => ({
        id: 'dep-1',
        dependsOnJobId: 'job-2',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      })),
    };

    const useCase = new AddJobDependencyUseCase(
      jobsRepository as never,
      jobObservabilityRepository as never,
    );

    const result = await useCase.execute('job-1', 'job-2');

    expect(jobObservabilityRepository.addDependency).toHaveBeenCalledWith({
      jobId: 'job-1',
      organizationId: 'org-1',
      dependsOnJobId: 'job-2',
    });
    expect(result).toMatchObject({
      id: 'dep-1',
      dependsOnJobId: 'job-2',
      dependsOnJobStatus: 'COMPLETED',
    });
  });
});
