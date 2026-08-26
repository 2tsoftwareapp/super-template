export interface AuthUserModel {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  passwordHash: string;
  status: string;
  emailVerifiedAt: Date | null;
  mustChangePassword: boolean;
  createdAt: Date;
  updatedAt: Date;
}
