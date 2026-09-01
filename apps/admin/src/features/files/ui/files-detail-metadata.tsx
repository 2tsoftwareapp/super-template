"use client";

import {
  ResourcePropertyGrid,
  type ResourcePropertyItem,
} from "@repo/web-ui/resource-property-grid";

import type { FileDto } from "@/lib/api-types";

import { scalarString } from "@/lib/format";

interface FilesDetailMetadataProps {
  file: FileDto;
}

export function FilesDetailMetadata({ file }: FilesDetailMetadataProps) {
  const properties: ResourcePropertyItem[] = [
    {
      label: "ID",
      value: file.id,
      type: "id",
      copyable: true,
    },
    {
      label: "Uploaded by",
      value: file.uploadedById ? scalarString(file.uploadedById) : "System",
      type: "id",
      copyable: Boolean(file.uploadedById),
    },
    {
      label: "Created",
      value: file.createdAt,
      type: "timestamp",
    },
    {
      label: "Updated",
      value: file.updatedAt,
      type: "timestamp",
    },
  ];

  return (
    <div className="space-y-4">
      <ResourcePropertyGrid properties={properties} columns={2} density="compact" />
    </div>
  );
}
