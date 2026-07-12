"use client";

import { useImportsController } from "@/features/imports/use-imports-controller";

import { ImportsListView } from "./imports-list-view";

/**
 * Imports screen: connects the imports controller to the presentational view.
 */
export function ImportsView() {
  const controller = useImportsController();

  return <ImportsListView {...controller} />;
}
