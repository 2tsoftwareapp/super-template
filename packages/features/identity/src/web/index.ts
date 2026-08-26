// Web surface of the identity feature plugin. Consumed by the Next.js web app
// via the `@repo/feature-identity/web` entrypoint; route files stay thin and
// only render these exports. This surface depends solely on kernel design-system
// packages (`@repo/web-ui`, `@repo/web-utils`), never on an app's `@/` aliases.
export {
  useVerifyEmailController,
  verifyEmail,
  type VerifyEmailSearchParams,
  type VerifyEmailStatus,
  type VerifyEmailViewModel,
  VerifyEmailContent,
  VerifyEmailView,
} from "./verify-email";
