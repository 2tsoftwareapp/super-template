"use client";

import { useQuery } from "@tanstack/react-query";
import { ScrollText } from "lucide-react";
import { useQueryStates } from "nuqs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "@/hooks/use-session";
import type { AuditLogsListResponse } from "@/lib/api-types";
import { webFetch } from "@/lib/http";
import {
  auditLogsSearchParams,
  buildAuditLogsListPath,
  sortOrderOptions,
} from "@/lib/search-params";

export function AuditLogsView() {
  const session = useSession();
  const [filters, setFilters] = useQueryStates(auditLogsSearchParams);
  const canReadAudit =
    session.data?.data.permissions.includes("audit.read") ?? false;
  const auditLogs = useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: () =>
      webFetch<AuditLogsListResponse>(buildAuditLogsListPath(filters)),
    enabled: canReadAudit,
  });

  if (!canReadAudit) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-3xl">403</CardTitle>
          <CardDescription>
            Your account does not include `audit.read`.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Badge variant="outline" className="w-fit">
          Admin
        </Badge>
        <h1 className="text-4xl font-semibold">Audit logs</h1>
      </div>
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-xl">Filters</CardTitle>
          <CardDescription>
            Filter audit events by actor, action, and resource.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="action">Action</Label>
            <Input
              id="action"
              value={filters.action}
              onChange={(event) =>
                void setFilters({ action: event.target.value, page: 1 })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resourceType">Resource type</Label>
            <Input
              id="resourceType"
              value={filters.resourceType}
              onChange={(event) =>
                void setFilters({ resourceType: event.target.value, page: 1 })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Sort order</Label>
            <Select
              value={filters.sortOrder}
              onValueChange={(value) =>
                void setFilters({
                  sortOrder: value as typeof filters.sortOrder,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sort order" />
              </SelectTrigger>
              <SelectContent>
                {sortOrderOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border p-0">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-xl">Events</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {auditLogs.isLoading ? (
            <div className="flex min-h-40 items-center justify-center">
              <Spinner className="size-5 text-primary" />
            </div>
          ) : auditLogs.data?.data.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Actor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.data.data.map((log) => {
                  const entityId = log.entityId ? String(log.entityId) : null;
                  const actorId = log.actorId ? String(log.actorId) : "system";

                  return (
                  <TableRow key={log.id}>
                    <TableCell>
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>
                      {log.entityType}
                      {entityId ? ` / ${entityId.slice(0, 8)}` : ""}
                    </TableCell>
                    <TableCell>{actorId}</TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="p-6">
              <Empty className="border-border bg-muted/30">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ScrollText className="size-4" />
                  </EmptyMedia>
                  <EmptyTitle>No audit events</EmptyTitle>
                  <EmptyDescription>
                    Adjust filters or perform actions to generate logs.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>
          Page {auditLogs.data?.meta.page ?? filters.page} of{" "}
          {auditLogs.data?.meta.totalPages ?? 1}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={filters.page <= 1}
            onClick={() =>
              void setFilters({ page: Math.max(1, filters.page - 1) })
            }
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={
              (auditLogs.data?.meta.totalPages ?? filters.page) <= filters.page
            }
            onClick={() => void setFilters({ page: filters.page + 1 })}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
