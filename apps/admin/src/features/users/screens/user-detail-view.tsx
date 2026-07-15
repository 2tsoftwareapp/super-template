"use client";

import { Skeleton } from "@repo/web-ui/skeleton";

import { ResourcePageShell } from "@/components/resource-page-shell";
import { useUserDetailController } from "@/features/users/controllers/use-user-detail-controller";
import { Link } from "@/i18n/navigation";
import { adminResources } from "@/lib/admin-resources";

import { UserDetailContent } from "../ui/user-detail-content";

const usersResource = adminResources.find((r) => r.id === "users")!;

/**
 * User detail screen: connects the user detail controller to the presentational
 * content and handles the loading / not-found boundaries.
 */
export function UserDetailView() {
  const controller = useUserDetailController();

  if (controller.isLoading) {
    return (
      <ResourcePageShell resource={usersResource} description="Manage user profile.">
        <Skeleton className="h-72 rounded-xl" />
      </ResourcePageShell>
    );
  }

  if (!controller.currentUser) {
    return (
      <ResourcePageShell resource={usersResource} description="User not found.">
        <div className="flex flex-col items-center gap-3 py-16">
          <p className="text-sm text-muted-foreground">User not found.</p>
          <Link href="/users" className="text-sm underline">
            Back to users
          </Link>
        </div>
      </ResourcePageShell>
    );
  }

  return (
    <UserDetailContent
      key={controller.currentUser.id}
      vm={controller}
      user={controller.currentUser}
    />
  );
}
