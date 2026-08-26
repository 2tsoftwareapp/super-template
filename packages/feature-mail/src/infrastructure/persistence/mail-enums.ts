import { pgEnum } from "drizzle-orm/pg-core";

export const mailDeliveryStatusEnum = pgEnum("mail_delivery_status", [
  "PENDING",
  "PROCESSING",
  "PROVIDER_ACCEPTED",
  "SENT",
  "FAILED",
]);
