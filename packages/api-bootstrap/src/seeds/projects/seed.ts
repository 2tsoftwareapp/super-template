import type { ProjectsRepository } from '@repo/api-workspace/modules/projects/infrastructure/projects.repository';

import { type DatabaseExecutor } from '@repo/api-database';

import { type SeededUsersContext } from '../types';

export async function seedProjects(
  projectsRepository: ProjectsRepository,
  context: SeededUsersContext,
  executor: DatabaseExecutor,
): Promise<void> {
  // Keep project fixtures deterministic so the seed can run repeatedly without duplicating records.
  const ensureProject = async (
    ownerId: string,
    organizationId: string,
    name: string,
    description: string,
  ) => {
    const existing = await projectsRepository.findActiveByOwnerAndName(
      ownerId,
      name,
      executor,
    );

    if (!existing) {
      await projectsRepository.create(
        {
          ownerId,
          organizationId,
          name,
          description,
          status: 'ACTIVE',
          createdById: context.adminUserId,
        },
        executor,
      );
    }
  };

  await ensureProject(
    context.adminUserId,
    context.adminOrganizationId,
    'Starter Admin Project',
    'Reference admin-owned project',
  );
  await ensureProject(
    context.regularUserId,
    context.regularOrganizationId,
    'Starter User Project',
    'Reference user-owned project',
  );
}
