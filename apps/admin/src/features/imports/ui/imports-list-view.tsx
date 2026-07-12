"use client";

import { Badge } from "@repo/web-core/components/badge";
import { Button } from "@repo/web-core/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/web-core/components/card";
import { ConfirmDialog } from "@repo/web-core/components/confirm-dialog";
import { ErrorState } from "@repo/web-core/components/error-state";
import { Input } from "@repo/web-core/components/input";
import { Label } from "@repo/web-core/components/label";
import { SectionLoading } from "@repo/web-core/components/loading";
import { LoadingButton } from "@repo/web-core/components/loading-button";
import { Separator } from "@repo/web-core/components/separator";
import { Show } from "@repo/web-core/components/show";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
} from "lucide-react";

import type { ImportsViewModel } from "@/features/imports/controllers/use-imports-controller";

import { ResourcePageShell } from "@/components/resource-page-shell";
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

/**
 * Presentational imports view. Receives a fully-resolved view model from the
 * imports controller and renders it; it owns no server state or orchestration.
 */
export function ImportsListView({
  form,
  lookup,
  job,
  confirm,
}: ImportsViewModel) {
  const jobData = job.data;
  const sb = job.status ? statusBadge(job.status) : null;
  const Icon = sb?.icon;

  return (
    <ResourcePageShell
      resource={importsResource}
      description="Create import jobs from uploaded files, inspect progress, and confirm when ready."
    >
      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
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
                value={form.fileId}
                onChange={(e) => form.onFileIdChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="import-type">Type</Label>
              <select
                id="import-type"
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-hidden transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                value={form.type}
                onChange={(e) => form.onTypeChange(e.target.value)}
              >
                {IMPORT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <LoadingButton
              className="w-full"
              onClick={form.onCreate}
              disabled={!form.canSubmit}
              loading={form.isCreating}
            >
              Create import
            </LoadingButton>
          </CardContent>
        </Card>

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
                  value={lookup.jobId}
                  onChange={(e) => lookup.onJobIdChange(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={lookup.onRefresh}
                disabled={lookup.isFetching || !lookup.jobId}
              >
                <RefreshCw
                  className={cn("size-3.5", lookup.isFetching && "animate-spin")}
                />
              </Button>
            </div>

            <Show when={!!lookup.jobId && job.isLoading}>
              <SectionLoading />
            </Show>
            <Show when={job.isError}>
              <ErrorState
                variant="inline"
                title="Could not load job. Check the ID and try again."
              />
            </Show>
            {!job.isLoading && !job.isError && !jobData ? (
              <div className="rounded-xl border border-border p-6 text-center text-sm text-muted-foreground">
                {lookup.jobId
                  ? "No data returned"
                  : "Enter a job ID and click refresh"}
              </div>
            ) : !job.isLoading && !job.isError && jobData ? (
              <div className="space-y-4 rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{jobData.type}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                      {jobData.id}
                    </p>
                  </div>
                  {Icon && sb && (
                    <Badge
                      variant={sb.variant}
                      className={cn("gap-1 capitalize", sb.className)}
                    >
                      <Icon className="size-3" />
                      {job.status.toLowerCase()}
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
                    <span className="font-mono">
                      {jobData.fileId.slice(0, 8)}…
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span>{timeAgo(jobData.createdAt)}</span>
                  </div>
                  {jobData.completedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Completed</span>
                      <span>
                        {timeAgo(scalarString(jobData.completedAt, ""))}
                      </span>
                    </div>
                  )}
                  {jobData.confirmedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Confirmed</span>
                      <span>
                        {timeAgo(scalarString(jobData.confirmedAt, ""))}
                      </span>
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
                          <p
                            key={i}
                            className="text-[10px] text-muted-foreground"
                          >
                            Row {String(err.row ?? "?")}:{" "}
                            {String(err.message ?? "")}
                          </p>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {confirm.canConfirm && (
                  <LoadingButton
                    className="w-full"
                    variant="outline"
                    onClick={confirm.onOpen}
                    loading={confirm.isConfirming}
                  >
                    Confirm import
                  </LoadingButton>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirm.open}
        title="Confirm import"
        message="This will apply the imported data. This action cannot be undone."
        confirmLabel="Confirm"
        loading={confirm.isConfirming}
        onCancel={confirm.onCancel}
        onConfirm={confirm.onConfirm}
      />
    </ResourcePageShell>
  );
}
