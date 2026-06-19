"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import type { CreateImportInput, ImportJobDto } from "@/lib/api-types";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { webFetch } from "@/lib/http";

export function ImportsView() {
  const [fileId, setFileId] = useState("");
  const [type, setType] = useState("users");
  const [jobId, setJobId] = useState("");

  const createImport = useMutation({
    mutationFn: (input: CreateImportInput) =>
      webFetch<{ data: ImportJobDto }>("/api/bff/imports", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
  const job = useQuery({
    queryKey: ["admin-import-job", jobId],
    queryFn: () =>
      webFetch<{ data: ImportJobDto }>(`/api/bff/imports/${jobId}`),
    enabled: Boolean(jobId),
  });
  const confirm = useMutation({
    mutationFn: (id: string) =>
      webFetch<{ data: ImportJobDto }>(`/api/bff/imports/${id}/confirm`, {
        method: "POST",
      }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        label="Imports"
        title="Import review"
        description="Create imports, inspect jobs by id, and confirm them when ready."
      />
      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Create import</CardTitle>
            <CardDescription>
              Provide the file id and import payload.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="import-file-id">File ID</Label>
              <Input
                id="import-file-id"
                value={fileId}
                onChange={(event) => setFileId(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="import-type">Type</Label>
              <Input
                id="import-type"
                value={type}
                onChange={(event) => setType(event.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={() =>
                void createImport.mutateAsync({
                  fileId,
                  type,
                })
              }
              disabled={createImport.isPending}
            >
              {createImport.isPending ? "Creating..." : "Create import"}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Lookup job</CardTitle>
            <CardDescription>
              Inspect an import by id and confirm it when ready.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="import-job-id">Import ID</Label>
              <Input
                id="import-job-id"
                value={jobId}
                onChange={(event) => setJobId(event.target.value)}
              />
            </div>
            <Button variant="outline" onClick={() => void job.refetch()}>
              Refresh
            </Button>
            <div className="rounded-2xl border border-border p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">
                {job.data?.data.type ?? "No job loaded"}
              </p>
              <p>Status: {job.data?.data.status ?? "-"}</p>
              <p>File: {job.data?.data.fileId ?? "-"}</p>
              <p>
                Rows:{" "}
                {job.data?.data.rowCount
                  ? JSON.stringify(job.data.data.rowCount)
                  : "-"}
              </p>
              <pre className="mt-3 whitespace-pre-wrap text-xs">
                {job.data?.data ? JSON.stringify(job.data.data, null, 2) : ""}
              </pre>
            </div>
            <Button
              variant="outline"
              onClick={() => void confirm.mutateAsync(jobId)}
              disabled={!jobId || confirm.isPending}
            >
              {confirm.isPending ? "Confirming..." : "Confirm import"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
