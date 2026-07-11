import type { Metadata } from "next";

import { Suspense } from "react";

import { Spinner } from "@/components/ui/spinner";
import { AuditLogsView } from "@/features/audit-logs/components/audit-logs-view";

export const metadata: Metadata = {
  title: "Audit Logs | Super Admin",
  description: "Monitor and query the system audit trail and user activities.",
};

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
