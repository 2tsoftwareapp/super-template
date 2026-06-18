import type { ProjectRecord } from './projects.repository.port';
import type { ProjectView } from './projects.types';

export class ProjectsMapper {
  toProjectView(project: ProjectRecord): ProjectView {
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

  /** @deprecated Use toProjectView */
  toProjectDto(project: ProjectRecord): ProjectView {
    return this.toProjectView(project);
  }
}
