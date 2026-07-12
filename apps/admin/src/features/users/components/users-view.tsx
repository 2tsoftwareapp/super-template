"use client";

import { ErrorState } from "@repo/web-core/components/error-state";
import { Spinner } from "@repo/web-core/components/spinner";

import { useUsersListController } from "@/features/users/use-users-list-controller";

import { UsersListView } from "./users-list-view";

/**
 * Users list screen: connects the users list controller to the presentational
 * view and handles the top-level session loading/error boundaries.
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
