"use client";

import { Badge } from "@repo/web-ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/web-ui/card";
import { CommonResourcePage } from "@repo/web-ui/common-resource-page";
import { ConfirmDialog } from "@repo/web-ui/confirm-dialog";
import { ErrorState } from "@repo/web-ui/error-state";
import { SectionLoading } from "@repo/web-ui/loading";
import { LoadingButton } from "@repo/web-ui/loading-button";
import { ResourceFilterBar } from "@repo/web-ui/resource-filter-bar";
import { Separator } from "@repo/web-ui/separator";
import { Show } from "@repo/web-ui/show";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/web-ui/table";
import { AlertCircle, CheckCircle2, Clock, Loader2 } from "lucide-react";

import type { ImportsViewModel } from "@/features/imports/model/imports.types";

import { adminResources } from "@/features/_plugin-resources/admin-resources";
import { CreateImportForm } from "@/features/imports/ui/create-import-form";
import { scalarString, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const importsResource = adminResources.find((r) => r.id === "imports")!;

function statusBadge(status: string) {
  switch (status) {
    case "COMPLETED":
      return { variant: "default" as const, icon: CheckCircle2, className: "" };
    case "PENDING":
      return { variant: "secondary" as const, icon: Clock, className: "" };
    case "PROCESSING":
      return {
        variant: "outline" as const,
        icon: Loader2,
        className: "animate-spin text-primary",
      };
    case "FAILED":
      return {
        variant: "destructive" as const,
        icon: AlertCircle,
        className: "",
      };
    case "CANCELLED":
      return { variant: "outline" as const, icon: Clock, className: "" };
    default:
      return { variant: "outline" as const, icon: Clock, className: "" };
  }
}

/**
 * Presentational imports view. Standardized on CommonResourcePage architecture.
 * Receives a fully-resolved view model from the imports controller and renders it;
 * it owns no server state or orchestration.
 */
export function ImportsListView({ form, lookup, job, confirm }: ImportsViewModel) {
  const jobData = job.data;
  const sb = job.status ? statusBadge(job.status) : null;
  const Icon = sb?.icon;

  const totalRows = typeof jobData?.rowCount === "number" ? jobData.rowCount : 0;
  const successCount = typeof jobData?.successCount === "number" ? jobData.successCount : 0;
  const errorCount = typeof jobData?.errorCount === "number" ? jobData.errorCount : 0;
  const processedRows = successCount + errorCount;
  const progressPercent =
    totalRows > 0 ? Math.min(100, Math.round((processedRows / totalRows) * 100)) : 0;
  return (
    <>
      <CommonResourcePage
        resource={importsResource}
        description="Create import jobs from uploaded files, inspect progress, and confirm when ready."
        isRefreshing={lookup.isFetching}
        onRefresh={lookup.onRefresh}
        cardWrapper={false}
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
              <CreateImportForm
                importTypes={form.importTypes}
                canCreate={form.canCreate}
                isCreating={form.isCreating}
                onSubmit={form.onSubmit}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Job detail</CardTitle>
              <CardDescription>Look up an import job by ID to inspect and confirm.</CardDescription>
            </CardHeader>
            <ResourceFilterBar
              search={{
                value: lookup.jobId,
                onChange: lookup.onJobIdChange,
                placeholder: "Import job ID",
              }}
            />
            <CardContent className="space-y-4">
              <Show when={!!lookup.jobId && job.isLoading}>
                <SectionLoading />
              </Show>
              <Show when={job.isError}>
                <ErrorState
                  variant="inline"
                  title="Could not load job. Check the ID and try again."
                  action={{ label: "Retry", onClick: job.onRetry }}
                />
              </Show>
              {!job.isLoading && !job.isError && !jobData ? (
                <div className="rounded-xl border border-border p-6 text-center text-sm text-muted-foreground">
                  {lookup.jobId ? "No data returned" : "Enter a job ID and click refresh"}
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
                      <Badge variant={sb.variant} className={cn("gap-1 capitalize", sb.className)}>
                        <Icon className="size-3" />
                        {job.status.toLowerCase()}
                      </Badge>
                    )}
                  </div>

                  {totalRows > 0 ? (
                    <div className="space-y-1.5 rounded-lg border border-border/60 bg-muted/20 p-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-muted-foreground">
                          Execution progress
                        </span>
                        <span className="font-mono font-medium">{progressPercent}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  ) : null}

                  <Separator />

                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Rows</span>
                      <p className="mt-0.5 font-medium">{scalarString(jobData.rowCount)}</p>
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
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-destructive">
                          Validation errors ({jobData.errors.length})
                        </p>
                        <div className="max-h-48 overflow-y-auto rounded-lg border border-border/80">
                          <Table>
                            <TableHeader>
                              <TableRow className="h-8 text-[11px]">
                                <TableHead className="w-16">Row</TableHead>
                                <TableHead>Error message</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {jobData.errors.map((err, i) => (
                                <TableRow key={i} className="h-8 text-xs">
                                  <TableCell className="font-mono text-muted-foreground">
                                    {String(err.row ?? "?")}
                                  </TableCell>
                                  <TableCell className="text-destructive font-medium">
                                    {String(err.message ?? "")}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
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
      </CommonResourcePage>

      <ConfirmDialog
        open={confirm.open}
        title="Confirm import"
        message="This will apply the imported data. This action cannot be undone."
        confirmLabel="Confirm"
        loading={confirm.isConfirming}
        onCancel={confirm.onCancel}
        onConfirm={confirm.onConfirm}
      />
    </>
  );
}
