export interface AuthenticatedRequestUser {
  userId: string;
  sessionId: string;
  email: string;
  displayName: string;
  status: 'PENDING' | 'ACTIVE' | 'BLOCKED';
  roles: string[];
  permissions: string[];
}

export interface RequestContext {
  requestId: string;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}
