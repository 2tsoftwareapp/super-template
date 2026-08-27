import { Inject, Injectable } from "@nestjs/common";

import { JOB_HANDLER, type JobHandlerContext } from "../../public/job-handler.port";

/**
 * Reserved no-op job type for future orphaned-file cleanup.
 */
async function filesCleanupHandler(_context: JobHandlerContext): Promise<void> {
  // Reserved no-op job type for future orphaned-file cleanup.
}

type Handler = (context: JobHandlerContext) => Promise<void>;

interface Contribution {
  readonly type: string;
  readonly handle: (context: JobHandlerContext) => Promise<void>;
}

/**
 * Dispatches jobs to feature-contributed handlers. The jobs core never imports
 * an owning feature: mail/notification/auth features register JOB_HANDLER
 * multi-providers for their own job types.
 */
@Injectable()
export class JobHandlersRegistry {
  private readonly handlers = new Map<string, Handler>();

  constructor(
    @Inject(JOB_HANDLER)
    private readonly contributions: Contribution[],
  ) {
    this.registerHandler("files.cleanup", filesCleanupHandler);

    for (const contribution of this.contributions) {
      this.registerHandler(contribution.type, contribution.handle);
    }
  }

  registerHandler(type: string, handler: Handler): void {
    if (this.handlers.has(type)) {
      throw new Error(`Duplicate job handler for type "${type}"`);
    }
    this.handlers.set(type, handler);
  }

  getHandler(type: string): Handler | undefined {
    return this.handlers.get(type);
  }

  hasHandler(type: string): boolean {
    return this.handlers.has(type);
  }
}
