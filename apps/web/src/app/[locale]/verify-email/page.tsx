import type { Metadata } from "next";

import { VerifyEmailView } from "@repo/feature-identity/web";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Verify email",
};

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailView />
    </Suspense>
  );
}

