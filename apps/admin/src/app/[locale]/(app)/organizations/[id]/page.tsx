import type { Metadata } from "next";

import { Suspense } from "react";

import { OrganizationDetailView } from "@/features/organizations";

export const metadata: Metadata = {
  title: "Organization Details | Super Admin",
  description: "View workspace details, rename, delete, and manage tenant members.",
};

export default function Page() {
  return (
    <Suspense>
      <OrganizationDetailView />
    </Suspense>
  );
}
