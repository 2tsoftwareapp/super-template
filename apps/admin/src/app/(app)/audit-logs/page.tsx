import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";

import { AuditLogsView } from "./audit-logs-view";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-48 items-center justify-center">
          <Spinner className="size-5" />
        </div>
      }
    >
      <AuditLogsView />
    </Suspense>
  );
}
