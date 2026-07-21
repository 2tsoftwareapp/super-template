"use client";

import { useOrganizationSwitcherController } from "../controllers/use-organization-switcher-controller";
import { OrganizationSwitcherView } from "./organization-switcher-view";

/** Shell entry: wires the switcher controller to the presentational view. */
export function OrganizationSwitcher() {
  const vm = useOrganizationSwitcherController();

  return <OrganizationSwitcherView {...vm} />;
}
