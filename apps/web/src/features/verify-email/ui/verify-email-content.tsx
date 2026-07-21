import { ErrorState } from "@repo/web-ui/error-state";
import { Spinner } from "@repo/web-ui/spinner";

import type { VerifyEmailStatus } from "../model/verify-email.types";

export interface VerifyEmailContentProps {
  status: VerifyEmailStatus;
  message: string;
}

export function VerifyEmailContent({ status, message }: VerifyEmailContentProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        {status === "verifying" ? (
          <>
            <Spinner className="mx-auto size-8 text-primary" />
            <p className="mt-4 text-muted-foreground">
              Verifying your email...
            </p>
          </>
        ) : null}

        {status === "success" ? (
          <>
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckIcon />
            </div>
            <h1 className="text-xl font-semibold">Email verified!</h1>
            <p className="mt-2 text-muted-foreground">{message}</p>
            <p className="mt-4 text-sm text-muted-foreground">
              Redirecting to admin...
            </p>
          </>
        ) : null}

        {status === "error" ? (
          <ErrorState
            title="Verification failed"
            description={message}
            className="min-h-0"
          />
        ) : null}
      </div>
    </main>
  );
}

function CheckIcon() {
  return (
    <svg
      className="size-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
