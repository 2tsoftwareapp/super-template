import { Suspense } from "react";

import { VerifyEmailView } from "@/features/verify-email";

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailView />
    </Suspense>
  );
}
