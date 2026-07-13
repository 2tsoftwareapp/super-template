"use client";

import { Label } from "@repo/web-ui/label";
import { Separator } from "@repo/web-ui/separator";

import type { AuditLogDto } from "@/lib/api-types";

import { formatAuditAction } from "@/features/audit-logs/model/audit-logs.filters";
import { formatDateTime } from "@/lib/format";

interface AuditLogsEventDetailProps {
  entry: AuditLogDto;
}

export function AuditLogsEventDetail({ entry }: AuditLogsEventDetailProps) {
  return (
    <div className="space-y-4 text-sm">
      <div>
        <Label className="text-xs text-muted-foreground">ID</Label>
        <p className="mt-0.5 font-mono text-xs">{entry.id}</p>
      </div>
      <Separator />
      <div>
        <Label className="text-xs text-muted-foreground">Action</Label>
        <p className="mt-0.5 font-medium">
          {formatAuditAction(entry.action)}
        </p>
      </div>
      <Separator />
      <div>
        <Label className="text-xs text-muted-foreground">
          Entity type
        </Label>
        <p className="mt-0.5">{entry.entityType ?? "—"}</p>
      </div>
      <Separator />
      <div>
        <Label className="text-xs text-muted-foreground">Entity ID</Label>
        <p className="mt-0.5 font-mono text-xs">
          {entry.entityId ?? "—"}
        </p>
      </div>
      <Separator />
      <div>
        <Label className="text-xs text-muted-foreground">Actor ID</Label>
        <p className="mt-0.5 font-mono text-xs">
          {entry.actorId ?? "System"}
        </p>
      </div>
      <Separator />
      {entry.metadata && (
        <>
          <div>
            <Label className="text-xs text-muted-foreground">
              Metadata
            </Label>
            <pre className="mt-0.5 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed">
              {JSON.stringify(entry.metadata, null, 2)}
            </pre>
          </div>
          <Separator />
        </>
      )}
      <div>
        <Label className="text-xs text-muted-foreground">Request ID</Label>
        <p className="mt-0.5 font-mono text-xs">
          {entry.requestId ?? "—"}
        </p>
      </div>
      <Separator />
      <div>
        <Label className="text-xs text-muted-foreground">IP address</Label>
        <p className="mt-0.5 font-mono text-xs">
          {entry.ipAddress ?? "—"}
        </p>
      </div>
      <Separator />
      <div>
        <Label className="text-xs text-muted-foreground">User agent</Label>
        <p className="mt-0.5 break-all text-xs text-muted-foreground">
          {entry.userAgent ?? "—"}
        </p>
      </div>
      <Separator />
      <div>
        <Label className="text-xs text-muted-foreground">Created at</Label>
        <p className="mt-0.5">{formatDateTime(entry.createdAt)}</p>
      </div>
    </div>
  );
}
