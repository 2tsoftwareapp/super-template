import { Suspense } from "react";

import { Spinner } from "@/components/ui/spinner";

import { MailView } from "./mail-view";

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
