"use client";

import { useOrganizationsController } from "@/features/organizations/controllers/use-organizations-controller";

import { OrganizationsListView } from "../ui/organizations-list-view";

/**
 * Organizations list screen: connects the list controller to the presentational view.
 */
export function OrganizationsView() {
  const controller = useOrganizationsController();

  return <OrganizationsListView {...controller} />;
}
