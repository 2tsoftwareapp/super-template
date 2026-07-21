import { Suspense } from "react";

import { VerifyEmailView } from "@/features/verify-email/screens/verify-email-view";

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailView />
    </Suspense>
  );
}
