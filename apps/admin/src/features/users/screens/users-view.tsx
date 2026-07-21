"use client";

import { ErrorState } from "@repo/web-ui/error-state";
import { Spinner } from "@repo/web-ui/spinner";

import { useUsersListController } from "@/features/users/controllers/use-users-list-controller";

import { UsersListView } from "../ui/users-list-view";

/**
 * Users list screen: session guard, then presentational list view from controller.
 */
export function UsersView() {
  const controller = useUsersListController();

  if (controller.session.isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner className="size-5" />
      </div>
    );
  }

  if (controller.session.isError) {
    return (
      <ErrorState
        title="Session error"
        description="Could not load your session. Try refreshing the page."
      />
    );
  }

  return <UsersListView {...controller} />;
}
