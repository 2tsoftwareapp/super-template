"use client";

import { Badge } from "@repo/web-ui/badge";
import { Label } from "@repo/web-ui/label";
import { Separator } from "@repo/web-ui/separator";

import type { MailDeliveryDto } from "@/lib/api-types";

import { ResourceDrawer } from "@/components/resource-drawer";
import { mailStatusProps } from "@/features/mail/model/mail.constants";
import { formatDateTime, formatUnknownDateTime, scalarString } from "@/lib/format";
import { cn } from "@/lib/utils";

interface MailDetailDrawerProps {
  selectedDelivery: MailDeliveryDto | null;
  onClose: () => void;
}

export function MailDetailDrawer({ selectedDelivery, onClose }: MailDetailDrawerProps) {
  return (
    <ResourceDrawer
      open={!!selectedDelivery}
      title="Delivery detail"
      description={selectedDelivery ? `Template: ${selectedDelivery.templateKey}` : ""}
      onClose={onClose}
    >
      {selectedDelivery && (
        <div className="space-y-4 text-sm">
          <div>
            <Label className="text-xs text-muted-foreground">ID</Label>
            <p className="mt-0.5 font-mono text-xs">{selectedDelivery.id}</p>
          </div>
          <Separator />
          <div>
            <Label className="text-xs text-muted-foreground">Template key</Label>
            <p className="mt-0.5 font-mono text-xs">{selectedDelivery.templateKey}</p>
          </div>
          <Separator />
          <div>
            <Label className="text-xs text-muted-foreground">Recipient</Label>
            <p className="mt-0.5">{selectedDelivery.recipient}</p>
          </div>
          <Separator />
          <div>
            <Label className="text-xs text-muted-foreground">Subject</Label>
            <p className="mt-0.5">{selectedDelivery.subject}</p>
          </div>
          <Separator />
          <div>
            <Label className="text-xs text-muted-foreground">Status</Label>
            <div className="mt-0.5">
              <Badge
                variant={mailStatusProps(String(selectedDelivery.status)).variant}
                className={cn(
                  "text-xs capitalize",
                  mailStatusProps(String(selectedDelivery.status)).className,
                )}
              >
                {String(selectedDelivery.status).toLowerCase()}
              </Badge>
            </div>
          </div>
          {selectedDelivery.errorMessage && (
            <>
              <Separator />
              <div>
                <Label className="text-xs text-muted-foreground">Error</Label>
                <p className="mt-0.5 text-destructive">
                  {scalarString(selectedDelivery.errorMessage)}
                </p>
              </div>
            </>
          )}
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Created at</Label>
              <p className="mt-0.5">{formatDateTime(selectedDelivery.createdAt)}</p>
            </div>
            {selectedDelivery.sentAt && (
              <div>
                <Label className="text-xs text-muted-foreground">Sent at</Label>
                <p className="mt-0.5">{formatUnknownDateTime(selectedDelivery.sentAt)}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </ResourceDrawer>
  );
}
