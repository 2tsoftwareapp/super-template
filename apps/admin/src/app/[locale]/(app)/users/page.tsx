import type { Metadata } from "next";

import { Suspense } from "react";

import { UsersView } from "@/features/users/screens/users-view";

export const metadata: Metadata = {
  title: "Users | Super Admin",
  description: "Manage users, authorization profiles, and access settings.",
};

export default function Page() {
  return (
    <Suspense>
      <UsersView />
    </Suspense>
  );
}
