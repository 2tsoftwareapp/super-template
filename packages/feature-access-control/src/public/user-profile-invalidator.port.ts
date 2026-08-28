export interface UserProfileInvalidator {
  invalidateAccessProfile(userId: string): Promise<void>;
}
