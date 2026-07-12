"use client";

import { useRolesController } from "@/features/roles/use-roles-controller";

import { RolesListView } from "./roles-list-view";

/**
 * Roles screen: connects the roles controller to the presentational view.
 */
export function RolesView() {
  const controller = useRolesController();

  return <RolesListView {...controller} />;
}
