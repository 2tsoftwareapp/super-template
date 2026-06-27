import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";

import { LoginView } from "./login-view";

function LoginFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-4">
        <Skeleton className="h-8 w-48" aria-hidden="true" />
        <Skeleton className="h-64 w-full rounded-xl" aria-hidden="true" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginView />
    </Suspense>
  );
}
