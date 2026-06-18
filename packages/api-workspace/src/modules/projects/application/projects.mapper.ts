import type { ProjectsRepository } from '../infrastructure/projects.repository';

export type ProjectRecord = NonNullable<
  Awaited<ReturnType<ProjectsRepository['findById']>>
>;

export class ProjectsMapper {
  toProjectDto(project: ProjectRecord) {
    return {
      id: project.id,
      name: project.name,
      description: project.description ?? null,
      status: project.status,
      ownerId: project.ownerId,
      createdById: project.createdById,
      updatedById: project.updatedById ?? null,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      deletedAt: project.deletedAt?.toISOString() ?? null,
    };
  }
}
