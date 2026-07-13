"use client";

import { FullScreenLoading } from "@repo/web-ui/loading";
import { createContext, type ReactNode, useContext } from "react";

import type { SessionUser } from "@/lib/api-types";

import { useAdminGuard } from "@/features/auth/controllers/use-admin-guard";

export interface AdminSession {
  user: SessionUser;
  permissions: string[];
  organizationId: string | null;
}

const AdminSessionContext = createContext<AdminSession | null>(null);

// Read the validated session inside the gated tree. Throws if used outside
// <AdminGuard>, which guarantees a non-null session wherever it resolves.
export function useAdminSession(): AdminSession {
  const session = useContext(AdminSessionContext);

  if (!session) {
    throw new Error("useAdminSession must be used within <AdminGuard>");
  }

  return session;
}

// Renders a loading screen for every non-ready guard state (loading + all
// pending redirects), and exposes the validated session to its subtree via
// context only once the user is authenticated and authorized for the route.
export function AdminGuard({ children }: { children: ReactNode }) {
  const decision = useAdminGuard();

  if (decision.status !== "ready") {
    return (
      <FullScreenLoading
        title="Restoring admin session"
        description="Loading permissions and workspace state."
      />
    );
  }

  return (
    <AdminSessionContext.Provider
      value={{
        user: decision.user,
        permissions: decision.permissions,
        organizationId: decision.organizationId,
      }}
    >
      {children}
    </AdminSessionContext.Provider>
  );
}
