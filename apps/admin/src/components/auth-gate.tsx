"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";

import { FullScreenLoading } from "@/components/ui/loading";
import { useSession } from "@/hooks/use-session";

interface AuthGateProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

export function AuthGate({
  children,
  fallbackTitle = "Checking credentials",
  fallbackDescription = "Verifying authentication and workspace configurations...",
}: AuthGateProps) {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session.isError) {
      router.replace("/login");
    }
  }, [session.isError, router]);

  if (session.isLoading) {
    return (
      <FullScreenLoading
        title={fallbackTitle}
        description={fallbackDescription}
      />
    );
  }

  if (session.isError || !session.data) {
    return null;
  }

  return <>{children}</>;
}
