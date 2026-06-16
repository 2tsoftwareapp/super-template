import { pgEnum } from 'drizzle-orm/pg-core';

export const userStatusEnum = pgEnum('user_status', [
  'PENDING',
  'ACTIVE',
  'BLOCKED',
]);

export const organizationMemberRoleEnum = pgEnum('organization_member_role', [
  'OWNER',
  'ADMIN',
  'MEMBER',
]);
