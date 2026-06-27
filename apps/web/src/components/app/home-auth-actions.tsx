"use client";

import { useQuery } from "@tanstack/react-query";
import { LogIn, UserPlus } from "lucide-react";
import Link from "next/link";

import type { AuthSessionResponse } from "@/lib/api-types";

import { Avatar } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button-variants";
import { ApiClientError, webFetch } from "@/lib/http";

type Size = "sm" | "default" | "lg";

interface HomeAuthActionsProps {
  size?: Size;
}

export function HomeAuthActions({ size = "sm" }: HomeAuthActionsProps) {
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

  if (session.isSuccess && session.data) {
    const user = session.data.data.user;
    return (
      <div className="flex items-center gap-2 rounded-full border border-border bg-muted/50 py-1 pl-1 pr-3 text-sm">
        <Avatar name={user.displayName} size="sm" />
        <span className="max-w-[140px] truncate font-medium">
          {user.displayName}
        </span>
      </div>
    );
  }

  return (
    <>
      <Link
        href="/login"
        className={buttonVariants({ variant: "ghost", size })}
      >
        <LogIn className="size-4" />
        Sign in
      </Link>
      <Link href="/register" className={buttonVariants({ size })}>
        <UserPlus className="size-4" />
        Get started
      </Link>
    </>
  );
}
