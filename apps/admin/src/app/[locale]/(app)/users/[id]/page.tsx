import type { Metadata } from "next";

import { Suspense } from "react";

import { UserDetailView } from "@/features/users/screens/user-detail-view";

export const metadata: Metadata = {
  title: "User Profile | Super Admin",
  description: "View and edit user account info, permissions, and history.",
};

export default function Page() {
  return (
    <Suspense>
      <UserDetailView />
    </Suspense>
  );
}
