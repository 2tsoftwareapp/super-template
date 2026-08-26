import { pgEnum } from "drizzle-orm/pg-core";

export const organizationMemberRoleEnum = pgEnum("organization_member_role", [
  "OWNER",
  "ADMIN",
  "MEMBER",
]);
