"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { AuthSessionResponse } from "@/lib/api-types";

import { buttonVariants } from "@/components/ui/button-variants";
import { ApiClientError, webFetch } from "@/lib/http";
import { cn } from "@/lib/utils";

export function HomeAuthActions() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      try {
        return await webFetch<AuthSessionResponse>("/api/auth/session");
      } catch (error) {
        if (error instanceof ApiClientError && error.status === 401) {
          return null;
        }

        throw error;
      }
    },
    retry: false,
  });

  const signOut = useMutation({
    mutationFn: () => webFetch("/api/auth/logout", { method: "POST" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      router.refresh();
    },
  });

  if (session.isSuccess && session.data) {
    return (
      <>
        <Link href="/dashboard" className={buttonVariants()}>
          Open workspace
          <ArrowRight className="ml-2 size-4" />
        </Link>
        <button
          type="button"
          className={cn(buttonVariants({ variant: "outline" }))}
          onClick={() => signOut.mutate()}
          disabled={signOut.isPending}
        >
          <LogOut className="mr-2 size-4" />
          {signOut.isPending ? "Signing out..." : "Sign out"}
        </button>
      </>
    );
  }

  return (
    <>
      <Link href="/login" className={buttonVariants({ variant: "outline" })}>
        Sign in
      </Link>
      <Link href="#features" className={buttonVariants()}>
        Explore features
        <ArrowRight className="ml-2 size-4" />
      </Link>
    </>
  );
}
