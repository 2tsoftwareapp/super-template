import type {
  AuthenticatedRequestUser,
  RequestContext,
} from './request-context';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      requestContext?: RequestContext;
      user?: AuthenticatedRequestUser;
    }
  }
}
