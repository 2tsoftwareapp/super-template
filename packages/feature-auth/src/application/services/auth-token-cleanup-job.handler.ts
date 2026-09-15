import type { JobHandlerContext, JobHandlerContribution } from "@repo/api-kernel";

import { Inject, Injectable, type OnModuleInit, Optional } from "@nestjs/common";
import { JOB_HANDLER_REGISTRY, type JobHandlerRegistryPort } from "@repo/api-kernel";

import {
  AUTH_TOKEN_MAINTENANCE,
  type AuthTokenMaintenance,
} from "../../public/auth-token-maintenance.port";

/**
 * Processes the `auth.cleanup-tokens` background job. Auth owns token
 * lifecycle, so the handler lives here instead of the jobs core. The registry
 * is injected through the kernel-owned JOB_HANDLER_REGISTRY port and is
 * optional: without @repo/feature-jobs composed, auth still boots and only
 * skips background token maintenance.
 */
@Injectable()
export class AuthTokenCleanupJobHandler implements JobHandlerContribution, OnModuleInit {
  readonly type = "auth.cleanup-tokens";

  constructor(
    @Inject(AUTH_TOKEN_MAINTENANCE)
    private readonly authTokenCleanup: AuthTokenMaintenance,
    @Optional()
    @Inject(JOB_HANDLER_REGISTRY)
    private readonly handlerRegistry: JobHandlerRegistryPort | undefined,
  ) {}

  onModuleInit(): void {
    this.handlerRegistry?.registerHandler(this.type, (context) => this.handle(context));
  }

  async handle(_context: JobHandlerContext): Promise<void> {
    await this.authTokenCleanup.cleanupExpiredTokens();
  }
}
