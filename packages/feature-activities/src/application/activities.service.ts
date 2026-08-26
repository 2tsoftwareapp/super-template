import type { TransactionExecutor } from "@repo/api-runtime";

import { Injectable } from "@nestjs/common";

import type { ActivityEmitInput, ActivityEmitter } from "../public/activity-emitter.port";

import { EmitActivityUseCase } from "./use-cases/emit-activity.use-case";

/**
 * Adapter implementing the ACTIVITY_EMITTER port for cross-module activity
 * emission. Read paths (list) use ListActivitiesUseCase directly.
 */
@Injectable()
export class ActivitiesService implements ActivityEmitter {
  constructor(private readonly emitActivityUseCase: EmitActivityUseCase) {}

  async emit(input: ActivityEmitInput, executor?: TransactionExecutor): Promise<void> {
    await this.emitActivityUseCase.execute(input, executor);
  }
}
