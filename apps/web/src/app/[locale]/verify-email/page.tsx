import type { Metadata } from "next";

import { Suspense } from "react";

import { VerifyEmailView } from "@/features/identity-web";

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
