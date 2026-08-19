import type { Metadata } from "next";

import { Spinner } from "@repo/web-ui/spinner";
import { Suspense } from "react";

import { MailView } from "@/features/mail/screens/mail-view";

export const metadata: Metadata = {
  title: "Mail Logs & Templates | Super Admin",
  description: "View sent emails, preview templates, and send testing messages.",
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center py-32">
          <Spinner className="size-6" />
        </div>
      }
    >
      <MailView />
    </Suspense>
  );
}
