"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useSession } from "@/hooks/use-session";
import { usePathname, useRouter } from "@/i18n/navigation";

import { signOutAdmin } from "../api/auth.api";
import {
  type AdminGuardDecision,
  resolveAdminGuard,
} from "../model/admin-guard.state";
import { ADMIN_AUTH_ROUTES } from "../model/auth.constants";

// Single authoritative client gate: computes the guard decision from the
// session + current path, and performs the matching navigation side effect.
// The returned decision drives what AdminGuard renders.
export function useAdminGuard(): AdminGuardDecision {
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const decision = resolveAdminGuard({
    isLoading: session.isLoading,
    user: session.data?.data.user,
    permissions: session.data?.data.permissions,
    organizationId: session.data?.data.organizationId,
    pathname,
  });

  const { status } = decision;
  const redirectPath =
    decision.status === "redirect-resource" ? decision.path : null;

  useEffect(() => {
    switch (status) {
      case "redirect-login":
        router.replace(ADMIN_AUTH_ROUTES.login);
        break;
      case "sign-out":
        // Authenticated but not permitted in the admin app: end the session
        // and send them to login (never bounce back into the gated shell).
        void signOutAdmin(queryClient).finally(() => {
          router.replace(ADMIN_AUTH_ROUTES.login);
        });
        break;
      case "redirect-resource":
        if (redirectPath) {
          router.replace(redirectPath);
        }
        break;
      default:
        break;
    }
  }, [status, redirectPath, queryClient, router]);

  return decision;
}
