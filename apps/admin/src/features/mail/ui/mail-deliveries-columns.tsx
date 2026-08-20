"use client";

import { Badge } from "@repo/web-ui/badge";
import { Button } from "@repo/web-ui/button";
import { createColumnHelper } from "@tanstack/react-table";

import type { MailDeliveryDto } from "@/lib/api-types";

import { mailStatusProps } from "@/features/mail/model/mail.constants";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const columnHelper = createColumnHelper<MailDeliveryDto>();

/**
 * Column definitions for the mail deliveries list. Injected by the screen —
 * handlers live in the controller; this module stays presentational.
 */
export function createMailDeliveriesColumns({
  onSelectDelivery,
}: {
  onSelectDelivery: (delivery: MailDeliveryDto) => void;
}) {
  return [
    columnHelper.accessor("subject", {
      enableSorting: false,
      header: "Subject",
      cell: ({ getValue }) => (
        <span className="block max-w-[160px] truncate text-sm font-medium">{getValue()}</span>
      ),
    }),
    columnHelper.accessor("recipient", {
      enableSorting: false,
      header: "Recipient",
      cell: ({ getValue }) => (
        <span className="block text-xs text-muted-foreground">{getValue()}</span>
      ),
    }),
    columnHelper.accessor("status", {
      enableSorting: false,
      header: "Status",
      cell: ({ getValue }) => {
        const { variant, className } = mailStatusProps(String(getValue()));
        return (
          <Badge variant={variant} className={cn("text-xs capitalize", className)}>
            {String(getValue()).toLowerCase()}
          </Badge>
        );
      },
    }),
    columnHelper.accessor("createdAt", {
      header: "Sent",
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground">{timeAgo(getValue())}</span>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: () => null,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => onSelectDelivery(row.original)}
        >
          Detail
        </Button>
      ),
    }),
  ];
}
