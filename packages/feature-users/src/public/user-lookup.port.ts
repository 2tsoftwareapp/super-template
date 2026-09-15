export interface UserSummary {
  id: string;
  email: string;
  displayName: string;
  status: string;
}

export interface UserLookup {
  findById(userId: string): Promise<UserSummary | null>;
  filterExistingUserIds(userIds: string[]): Promise<string[]>;
  listDeliverableUserIds(): Promise<string[]>;
  findActiveUserInOrganization(userId: string, organizationId: string): Promise<UserSummary | null>;
  filterActiveUserIdsInOrganization(userIds: string[], organizationId: string): Promise<string[]>;
  listDeliverableUserIdsInOrganization(organizationId: string): Promise<string[]>;
}

export { USER_LOOKUP } from "./user-lookup.token";
