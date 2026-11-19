export type JobHandler = (payload: unknown) => Promise<unknown>;

/**
 * One entry per job type. Add a handler here and the queue starts running it;
 * there is no registry, decorator or manifest to keep in sync.
 */
export const handlers: Record<string, JobHandler> = {
  "demo.echo": async (payload) => ({ echo: payload, processedAt: new Date().toISOString() }),
  "demo.fail": async () => {
    throw new Error("demo failure (intentional)");
  },
};
