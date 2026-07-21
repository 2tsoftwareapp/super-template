"use client";

import { useEffect, useRef } from "react";

import { useSession } from "@/hooks/use-session";
import { usePathname, useRouter } from "@/i18n/navigation";

import { useLogoutMutation } from "../api/auth.mutations";
import {
  ADMIN_PASSWORD_CHANGE_PATH,
  type AdminGuardDecision,
  resolveAdminGuard,
} from "../model/admin-guard.state";
import { ADMIN_AUTH_ROUTES } from "../model/auth.constants";

/**
 * Wire the pure admin-guard state machine to session + navigation side effects.
 */
export function useAdminGuard(): AdminGuardDecision {
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { mutate: logout, isPending: isLoggingOut } = useLogoutMutation();
  const triggeredRef = useRef(false);

  const decision = resolveAdminGuard({
    isLoading: session.isLoading,
    user: session.data?.data.user,
    permissions: session.data?.data.permissions,
    organizationId: session.data?.data.organizationId,
    mustChangePassword: session.data?.data.mustChangePassword,
    pathname,
  });

  const { status } = decision;
  const redirectPath =
    decision.status === "redirect-resource" ? decision.path : null;

  useEffect(() => {
    switch (status) {
      case "sign-out":
        if (!isLoggingOut && !triggeredRef.current) {
          triggeredRef.current = true;
          logout(undefined, {
            onSettled: () => {
              router.replace(ADMIN_AUTH_ROUTES.login);
            },
          });
        }
        break;
      case "redirect-login":
        router.replace(ADMIN_AUTH_ROUTES.login);
        break;
      case "redirect-password-change":
        router.replace(ADMIN_PASSWORD_CHANGE_PATH);
        break;
      case "redirect-resource":
        if (redirectPath) {
          router.replace(redirectPath);
        }
        break;
    }
  }, [status, redirectPath, isLoggingOut, logout, router]);

  return decision;
}
