import type { JobHandlerContext, JobHandlerContribution } from "@repo/feature-jobs/contracts";

import { Inject, Injectable, type OnModuleInit } from "@nestjs/common";
import { JOB_HANDLER_REGISTRY, type JobHandlerRegistryPort } from "@repo/feature-jobs/contracts";

import {
  AUTH_TOKEN_MAINTENANCE,
  type AuthTokenMaintenance,
} from "../../public/auth-token-maintenance.port";

/**
 * Processes the `auth.cleanup-tokens` background job. Auth owns token
 * lifecycle, so the handler lives here instead of the jobs core.
 */
@Injectable()
export class AuthTokenCleanupJobHandler implements JobHandlerContribution, OnModuleInit {
  readonly type = "auth.cleanup-tokens";

  constructor(
    @Inject(AUTH_TOKEN_MAINTENANCE)
    private readonly authTokenCleanup: AuthTokenMaintenance,
    @Inject(JOB_HANDLER_REGISTRY) private readonly handlerRegistry: JobHandlerRegistryPort,
  ) {}

  onModuleInit(): void {
    this.handlerRegistry.registerHandler(this.type, (context) => this.handle(context));
  }

  async handle(_context: JobHandlerContext): Promise<void> {
    await this.authTokenCleanup.cleanupExpiredTokens();
  }
}
