"use client";

import { useVerifyEmailController } from "../controllers/use-verify-email-controller";
import { VerifyEmailContent } from "../ui/verify-email-content";

/** Verify-email screen: wires the handler to presentational status UI. */
export function VerifyEmailView() {
  const { status, message } = useVerifyEmailController();

  return <VerifyEmailContent status={status} message={message} />;
}
