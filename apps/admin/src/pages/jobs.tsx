import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { PageHeader } from "../components/page-header";
import { webFetch } from "../lib/http";
import type { JobDto, ListResponse } from "../lib/types";

export function JobsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const jobs = useQuery({
    queryKey: ["admin-jobs", status, type],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "50" });
      if (status) params.set("status", status);
      if (type) params.set("type", type);
      return webFetch<ListResponse<JobDto>>(`/api/v1/admin/jobs?${params.toString()}`);
    },
  });
  const cancelJob = useMutation({
    mutationFn: (id: string) =>
      webFetch<JobDto>(`/api/v1/admin/jobs/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        label="Jobs"
        title="Background jobs"
        description="Inspect queued jobs and cancel stalled work."
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <Input placeholder="Status" value={status} onChange={(event) => setStatus(event.target.value)} />
          <Input placeholder="Type" value={type} onChange={(event) => setType(event.target.value)} />
          <Button variant="outline" onClick={() => void jobs.refetch()}>
            Refresh
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Queue</CardTitle>
          <CardDescription>Manage scheduled and running jobs.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(jobs.data?.data ?? []).map((job) => (
                <TableRow key={job.id}>
                  <TableCell>{job.type}</TableCell>
                  <TableCell>{job.status}</TableCell>
                  <TableCell>{job.scheduledAt ?? "-"}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={cancelJob.isPending}
                      onClick={() => void cancelJob.mutateAsync(job.id)}
                    >
                      Cancel
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
