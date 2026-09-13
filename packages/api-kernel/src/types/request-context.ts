/**
 * Authorization model for organizations, selected at composition time.
 *
 * - `"personal-orgs"` — every new user is provisioned a personal organization
 *   (historical default; organizations are effectively mandatory).
 * - `"org-optional"` — users can exist and operate without any organization;
 *   organizations become an opt-in module users join when needed.
 */
export type OrganizationModel = "personal-orgs" | "org-optional";

/** Composed organization-model options derived from the feature registry. */
export interface OrganizationModelOptions {
  readonly organizationModel: OrganizationModel;
}

export interface AuthenticatedRequestUser {
  userId: string;
  sessionId: string;
  email: string;
  displayName: string;
  status: "PENDING" | "ACTIVE" | "BLOCKED";
  roles: string[];
  permissions: string[];
  organizationId: string | null;
  mustChangePassword?: boolean;
}

export interface RequestContext {
  requestId: string;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}
