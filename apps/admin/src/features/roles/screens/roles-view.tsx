"use client";

import { useRolesController } from "@/features/roles/controllers/use-roles-controller";

import { RolesListView } from "../ui/roles-list-view";

/**
 * Roles screen: connects the roles controller to the presentational view.
 */
export function RolesView() {
  const controller = useRolesController();

  return <RolesListView {...controller} />;
}
