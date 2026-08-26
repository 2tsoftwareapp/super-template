import { pgEnum } from "drizzle-orm/pg-core";

export const activityVisibilityEnum = pgEnum("activity_visibility", [
  "PUBLIC",
  "PRIVATE",
  "INTERNAL",
]);
