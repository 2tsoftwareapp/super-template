"use client";

import { ResourceDetailPane } from "@repo/web-ui/resource-detail-pane";
import {
  ResourcePropertyGrid,
  type ResourcePropertyItem,
} from "@repo/web-ui/resource-property-grid";

import type { MailDeliveryDto } from "@/lib/api-types";

import { mailStatusProps } from "@/features/mail/model/mail.constants";
import { scalarString } from "@/lib/format";

export interface MailDetailProps {
  selectedDelivery: MailDeliveryDto | null;
  onClose: () => void;
}

export function MailDetailContent({ selectedDelivery }: { selectedDelivery: MailDeliveryDto }) {
  const statusInfo = mailStatusProps(String(selectedDelivery.status));

  const properties: ResourcePropertyItem[] = [
    {
      label: "ID",
      value: selectedDelivery.id,
      type: "id",
      copyable: true,
    },
    {
      label: "Template key",
      value: selectedDelivery.templateKey,
      type: "id",
      copyable: true,
    },
    {
      label: "Recipient",
      value: selectedDelivery.recipient,
      copyable: true,
    },
    {
      label: "Subject",
      value: selectedDelivery.subject,
      colSpan: "full",
    },
    {
      label: "Status",
      value: String(selectedDelivery.status).toLowerCase(),
      type: "badge",
      badgeVariant: statusInfo.variant,
    },
    {
      label: "Created at",
      value: selectedDelivery.createdAt,
      type: "timestamp",
    },
  ];

  if (selectedDelivery.sentAt) {
    properties.push({
      label: "Sent at",
      value: selectedDelivery.sentAt,
      type: "timestamp",
    });
  }

  if (selectedDelivery.errorMessage) {
    properties.push({
      label: "Error",
      value: scalarString(selectedDelivery.errorMessage),
      colSpan: "full",
      className: "text-destructive",
    });
  }

  return (
    <div className="space-y-4">
      <ResourcePropertyGrid properties={properties} columns={2} density="default" />
    </div>
  );
}

export function MailDetailDrawer({ selectedDelivery, onClose }: MailDetailProps) {
  return (
    <ResourceDetailPane
      open={!!selectedDelivery}
      title="Delivery detail"
      description={selectedDelivery ? `Template: ${selectedDelivery.templateKey}` : ""}
      id={selectedDelivery?.id}
      onClose={onClose}
    >
      {selectedDelivery ? <MailDetailContent selectedDelivery={selectedDelivery} /> : null}
    </ResourceDetailPane>
  );
}
