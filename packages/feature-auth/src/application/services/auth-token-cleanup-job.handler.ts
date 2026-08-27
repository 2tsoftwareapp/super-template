import type { JobHandlerContext, JobHandlerContribution } from "@repo/feature-jobs/contracts";

import { Inject, Injectable } from "@nestjs/common";
import { JOB_HANDLER } from "@repo/feature-jobs/contracts";

import {
  AUTH_TOKEN_MAINTENANCE,
  type AuthTokenMaintenance,
} from "../../public/auth-token-maintenance.port";

/**
 * Processes the `auth.cleanup-tokens` background job. Auth owns token
 * lifecycle, so the handler lives here instead of the jobs core.
 */
@Injectable()
export class AuthTokenCleanupJobHandler implements JobHandlerContribution {
  readonly type = "auth.cleanup-tokens";

  constructor(
    @Inject(AUTH_TOKEN_MAINTENANCE)
    private readonly authTokenCleanup: AuthTokenMaintenance,
  ) {}

  async handle(_context: JobHandlerContext): Promise<void> {
    await this.authTokenCleanup.cleanupExpiredTokens();
  }
}

export const AUTH_TOKEN_CLEANUP_JOB_HANDLER_PROVIDER = {
  provide: JOB_HANDLER,
  useFactory: (handler: AuthTokenCleanupJobHandler) => handler,
  inject: [AuthTokenCleanupJobHandler],
  multi: true,
};
