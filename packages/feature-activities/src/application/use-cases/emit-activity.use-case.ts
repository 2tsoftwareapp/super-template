import type { JsonObject } from "@repo/api-kernel";
import type { TransactionExecutor } from "@repo/api-kernel";

import { Inject, Injectable } from "@nestjs/common";

import {
  ACTIVITIES_REPOSITORY,
  type ActivitiesRepositoryPort,
} from "../ports/activities.repository.port";

export interface EmitActivityInput {
  organizationId: string;
  summary: string;
  entityType: string;
  entityId: string;
  actorId?: string | null;
  visibility?: "PUBLIC" | "PRIVATE" | "INTERNAL";
  metadata?: JsonObject | null;
}

@Injectable()
export class EmitActivityUseCase {
  constructor(
    @Inject(ACTIVITIES_REPOSITORY) private readonly activitiesRepository: ActivitiesRepositoryPort,
  ) {}

  async execute(input: EmitActivityInput, executor?: TransactionExecutor) {
    return this.activitiesRepository.create(
      {
        organizationId: input.organizationId,
        summary: input.summary,
        entityType: input.entityType,
        entityId: input.entityId,
        actorId: input.actorId ?? null,
        visibility: input.visibility ?? "INTERNAL",
        metadata: input.metadata ?? null,
      },
      executor,
    );
  }
}
