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
}

export const USER_LOOKUP = Symbol('USER_LOOKUP');
