"use client";

import { ErrorState } from "@repo/web-ui/error-state";
import { Spinner } from "@repo/web-ui/spinner";

import { useUsersListController } from "@/features/users/controllers/use-users-list-controller";

import { UsersListView } from "../ui/users-list-view";
import { createUsersTableColumns } from "../ui/users-table-columns";

/**
 * Users list screen: session guard, then presentational list view from controller.
 * Injects the ui/ column factory so the handler layer never imports ui/ (§10).
 */
export function UsersView() {
  const controller = useUsersListController({
    createColumns: createUsersTableColumns,
  });

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
