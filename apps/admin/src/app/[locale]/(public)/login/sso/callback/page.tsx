import { Skeleton } from "@repo/web-core/components/skeleton";
import { Suspense } from "react";

import { SsoCallbackView } from "./sso-callback-view";

function SsoCallbackFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Skeleton className="h-4 w-40" aria-hidden="true" />
    </div>
  );
}

export default function SsoCallbackPage() {
  return (
    <Suspense fallback={<SsoCallbackFallback />}>
      <SsoCallbackView />
    </Suspense>
  );
}
