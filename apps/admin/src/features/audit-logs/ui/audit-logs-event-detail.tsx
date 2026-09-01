"use client";

import {
  ResourcePropertyGrid,
  type ResourcePropertyItem,
} from "@repo/web-ui/resource-property-grid";

import type { AuditLogDto } from "@/lib/api-types";

interface AuditLogsEventDetailProps {
  entry: AuditLogDto;
  formatAction: (action: string) => string;
}

export function AuditLogsEventDetail({ entry, formatAction }: AuditLogsEventDetailProps) {
  const properties: ResourcePropertyItem[] = [
    {
      label: "ID",
      value: entry.id,
      type: "id",
      copyable: true,
    },
    {
      label: "Action",
      value: formatAction(entry.action),
      type: "badge",
      badgeVariant: "secondary",
    },
    {
      label: "Entity type",
      value: entry.entityType ?? "—",
    },
    {
      label: "Entity ID",
      value: entry.entityId,
      type: "id",
      copyable: Boolean(entry.entityId),
    },
    {
      label: "Actor ID",
      value: entry.actorId ?? "System",
      type: "id",
      copyable: Boolean(entry.actorId),
    },
    {
      label: "Request ID",
      value: entry.requestId,
      type: "id",
      copyable: Boolean(entry.requestId),
    },
    {
      label: "IP address",
      value: entry.ipAddress,
      copyable: Boolean(entry.ipAddress),
    },
    {
      label: "Created at",
      value: entry.createdAt,
      type: "timestamp",
    },
    {
      label: "User agent",
      value: entry.userAgent ?? "—",
      colSpan: "full",
    },
  ];

  if (entry.metadata && Object.keys(entry.metadata).length > 0) {
    properties.push({
      label: "Metadata",
      value: entry.metadata,
      type: "json",
      colSpan: "full",
    });
  }

  return (
    <div className="space-y-4">
      <ResourcePropertyGrid properties={properties} columns={2} density="default" />
    </div>
  );
}
