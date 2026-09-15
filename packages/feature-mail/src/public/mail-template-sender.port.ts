/**
 * Kernel-owned mail port. Re-exported here so `@repo/feature-mail` keeps its
 * public surface stable; new consumers should import from `@repo/api-kernel`
 * directly.
 */
export {
  MAIL_TEMPLATE_SENDER,
  type MailTemplateSender,
  type MailTemplateSendInput,
} from "@repo/api-kernel";
