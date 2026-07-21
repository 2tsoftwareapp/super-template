"use client";

import { SectionLoading } from "@repo/web-ui/loading";

import { ResourcePageShell } from "@/components/resource-page-shell";
import { useOrganizationDetailController } from "@/features/organizations/controllers/use-organization-detail-controller";
import { adminResources } from "@/lib/admin-resources";

import { OrganizationDetailContent } from "../ui/organization-detail-content";

const organizationsResource = adminResources.find((r) => r.id === "organizations")!;

/**
 * Organization detail screen: connects the detail controller to the presentational
 * content and handles the loading boundary.
 */
export function OrganizationDetailView() {
  const controller = useOrganizationDetailController();

  if (controller.isLoading) {
    return (
      <ResourcePageShell
        resource={organizationsResource}
        description="Loading organization details..."
      >
        <SectionLoading />
      </ResourcePageShell>
    );
  }

  return <OrganizationDetailContent {...controller} />;
}
