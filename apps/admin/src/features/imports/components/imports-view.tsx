"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
} from "lucide-react";
import { useState } from "react";

import { ResourcePageShell } from "@/components/resource-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  useConfirmImportMutation,
  useCreateImportMutation,
} from "@/features/imports/use-imports-mutations";
import { useImportJobQuery } from "@/features/imports/use-imports-queries";
import { adminResources } from "@/lib/admin-resources";
import { scalarString, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const importsResource = adminResources.find((r) => r.id === "imports")!;

const IMPORT_TYPES = [
  { value: "users", label: "Users" },
  { value: "projects", label: "Projects" },
];

function statusBadge(status: string) {
  switch (status) {
    case "COMPLETED":
      return { variant: "default" as const, icon: CheckCircle2 };
    case "PENDING":
      return { variant: "secondary" as const, icon: Clock };
    case "PROCESSING":
      return {
        variant: "secondary" as const,
        icon: RefreshCw,
        className: "bg-accent text-accent-foreground border-border",
      };
    case "FAILED":
      return {
        variant: "outline" as const,
        icon: AlertCircle,
        className: "text-destructive border-destructive/40",
      };
    case "CANCELLED":
      return { variant: "outline" as const, icon: Clock };
    default:
      return { variant: "outline" as const, icon: Clock };
  }
}

export function ImportsView() {
  const [fileId, setFileId] = useState("");
  const [type, setType] = useState("users");
  const [jobId, setJobId] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const job = useImportJobQuery(jobId);

  const createImport = useCreateImportMutation({
    onSuccess: (result) => {
      setJobId(result.data.id);
      setFileId("");
    },
  });

  const confirm = useConfirmImportMutation({
    onSuccess: () => {
      void job.refetch();
    },
  });

  const jobData = job.data?.data;
  const s = typeof jobData?.status === "string" ? jobData.status : "";
  const sb = s ? statusBadge(s) : null;
  const Icon = sb?.icon;

  return (
    <ResourcePageShell
      resource={importsResource}
      description="Create import jobs from uploaded files, inspect progress, and confirm when ready."
    >
      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        {/* ── Create ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create import</CardTitle>
            <CardDescription>
              Queue a new import job referencing an uploaded file.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="import-file-id">File ID</Label>
              <Input
                id="import-file-id"
                placeholder="UUID of the uploaded file"
                value={fileId}
                onChange={(e) => setFileId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="import-type">Type</Label>
              <select
                id="import-type"
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-hidden transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {IMPORT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <Button
              className="w-full"
              onClick={() =>
                createImport.mutate({ fileId, type })
              }
              disabled={createImport.isPending || !fileId || !type}
            >
              {createImport.isPending ? (
                <><Spinner className="size-4" /> Queuing…</>
              ) : (
                "Create import"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* ── Lookup ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Job detail</CardTitle>
            <CardDescription>
              Look up an import job by ID to inspect and confirm.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Import job ID"
                  value={jobId}
                  onChange={(e) => setJobId(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => job.refetch()}
                disabled={job.isFetching || !jobId}
              >
                <RefreshCw
                  className={cn("size-3.5", job.isFetching && "animate-spin")}
                />
              </Button>
            </div>

            {jobId && job.isLoading ? (
              <div className="flex justify-center py-8">
                <Spinner className="size-5" />
              </div>
            ) : job.isError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                Could not load job. Check the ID and try again.
              </div>
            ) : !jobData ? (
              <div className="rounded-xl border border-border p-6 text-center text-sm text-muted-foreground">
                {jobId ? "No data returned" : "Enter a job ID and click refresh"}
              </div>
            ) : (
              <div className="space-y-4 rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{jobData.type}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                      {jobData.id}
                    </p>
                  </div>
                  {Icon && (
                    <Badge
                      variant={sb.variant}
                      className={cn("gap-1 capitalize", sb?.className)}
                    >
                      <Icon className="size-3" />
                      {s.toLowerCase()}
                    </Badge>
                  )}
                </div>

                <Separator />

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Rows</span>
                    <p className="mt-0.5 font-medium">
                      {scalarString(jobData.rowCount)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Success</span>
                    <p className="mt-0.5 font-medium text-primary">
                      {scalarString(jobData.successCount)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Errors</span>
                    <p className="mt-0.5 font-medium text-destructive">
                      {scalarString(jobData.errorCount)}
                    </p>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">File</span>
                    <span className="font-mono">{jobData.fileId.slice(0, 8)}…</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span>{timeAgo(jobData.createdAt)}</span>
                  </div>
                  {jobData.completedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Completed</span>
                      <span>{timeAgo(scalarString(jobData.completedAt, ""))}</span>
                    </div>
                  )}
                  {jobData.confirmedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Confirmed</span>
                      <span>{timeAgo(scalarString(jobData.confirmedAt, ""))}</span>
                    </div>
                  )}
                </div>

                {Array.isArray(jobData.errors) && jobData.errors.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-destructive">
                        Validation errors ({jobData.errors.length})
                      </p>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {jobData.errors.map((err, i) => (
                          <p key={i} className="text-[10px] text-muted-foreground">
                            Row {String(err.row ?? "?")}: {String(err.message ?? "")}
                          </p>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {(s === "PENDING" || s === "PROCESSING") && (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => setConfirmOpen(true)}
                    disabled={confirm.isPending}
                  >
                    {confirm.isPending ? (
                      <><Spinner className="size-4" /> Confirming…</>
                    ) : (
                      "Confirm import"
                    )}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm import"
        message="This will apply the imported data. This action cannot be undone."
        confirmLabel="Confirm"
        loading={confirm.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          confirm.mutate(jobId);
          setConfirmOpen(false);
        }}
      />
    </ResourcePageShell>
  );
}
