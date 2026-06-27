import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";

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
