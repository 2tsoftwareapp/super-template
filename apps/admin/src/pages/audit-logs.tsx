import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { PageHeader } from "../components/page-header";
import { webFetch } from "../lib/http";
import type { AuditLogDto, ListResponse } from "../lib/types";

export function AuditLogsPage() {
  const [actorId, setActorId] = useState("");
  const [action, setAction] = useState("");

  const auditLogs = useQuery({
    queryKey: ["admin-audit-logs", actorId, action],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "50" });
      if (actorId) params.set("actorId", actorId);
      if (action) params.set("action", action);
      return webFetch<ListResponse<AuditLogDto>>(`/api/v1/admin/audit-logs?${params.toString()}`);
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        label="Audit"
        title="Audit logs"
        description="Track admin actions and quickly inspect who changed what."
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Filters</CardTitle>
          <CardDescription>Query the recent audit stream.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <Input placeholder="Actor ID" value={actorId} onChange={(event) => setActorId(event.target.value)} />
          <Input placeholder="Action" value={action} onChange={(event) => setAction(event.target.value)} />
          <Button variant="outline" onClick={() => void auditLogs.refetch()}>
            Refresh
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Events</CardTitle>
          <CardDescription>Latest logs returned by the API.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(auditLogs.data?.data ?? []).map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.action}</TableCell>
                  <TableCell>{entry.entityType}</TableCell>
                  <TableCell>{renderValue(entry.actorId, "System")}</TableCell>
                  <TableCell>{new Date(entry.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function renderValue(value: unknown, fallback: string) {
  if (value == null) {
    return fallback;
  }

  return typeof value === "string" ? value : JSON.stringify(value);
}
