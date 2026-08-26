import type { AuthenticatedRequestUser, RequestContext } from "@repo/api-kernel";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      requestContext?: RequestContext;
      user?: AuthenticatedRequestUser;
    }
  }
}

export {};
