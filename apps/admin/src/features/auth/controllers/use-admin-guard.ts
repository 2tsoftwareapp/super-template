"use client";

import { useEffect } from "react";

import { useSession } from "@/hooks/use-session";
import { usePathname, useRouter } from "@/i18n/navigation";

import { useLogoutMutation } from "../api/auth.mutations";
import {
  type AdminGuardDecision,
  resolveAdminGuard,
} from "../model/admin-guard.state";
import { ADMIN_AUTH_ROUTES } from "../model/auth.constants";

export function useAdminGuard(): AdminGuardDecision {
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const logoutMutation = useLogoutMutation();

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
        logoutMutation.mutate();
        break;
      case "redirect-resource":
        if (redirectPath) {
          router.replace(redirectPath);
        }
        break;
      default:
        break;
    }
  }, [status, redirectPath, logoutMutation, router]);

  return decision;
}
