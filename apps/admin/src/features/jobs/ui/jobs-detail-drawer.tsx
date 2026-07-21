"use client";

import { Badge } from "@repo/web-ui/badge";
import { ErrorState } from "@repo/web-ui/error-state";
import { Label } from "@repo/web-ui/label";
import { SectionLoading } from "@repo/web-ui/loading";
import { Separator } from "@repo/web-ui/separator";
import { Show } from "@repo/web-ui/show";

import type { JobDto, JobEventDto } from "@/lib/api-types";

import { ResourceDrawer } from "@/components/resource-drawer";
import { JobsEventTimeline } from "@/features/jobs/ui/jobs-event-timeline";
import { formatDateTime, formatUnknownDateTime, scalarString } from "@/lib/format";
import { cn } from "@/lib/utils";

interface JobsDetailDrawerProps {
  isOpen: boolean;
  selectedJob: JobDto | null;
  detailLoading: boolean;
  detailError: boolean;
  onRetryDetail: () => void;
  events: JobEventDto[];
  eventsLoading: boolean;
  eventsError: boolean;
  onRetryEvents: () => void;
  onClose: () => void;
  statusProps: (status: string) => {
    variant: "default" | "secondary" | "outline";
    className?: string;
  };
}

export function JobsDetailDrawer({
  isOpen,
  selectedJob,
  detailLoading,
  detailError,
  onRetryDetail,
  events,
  eventsLoading,
  eventsError,
  onRetryEvents,
  onClose,
  statusProps,
}: JobsDetailDrawerProps) {
  return (
    <ResourceDrawer
      open={isOpen}
      title="Job detail"
      description={selectedJob ? `Type: ${selectedJob.type}` : "Loading\u2026"}
      onClose={onClose}
    >
      <Show when={detailLoading && !selectedJob}>
        <SectionLoading />
      </Show>

      <Show when={!detailLoading && detailError && !selectedJob}>
        <ErrorState
          variant="inline"
          title="Could not load job detail."
          action={{ label: "Retry", onClick: onRetryDetail }}
        />
      </Show>

      {selectedJob ? (
        <div className="space-y-4 text-sm">
          <div>
            <Label className="text-xs text-muted-foreground">ID</Label>
            <p className="mt-0.5 font-mono text-xs">{selectedJob.id}</p>
          </div>
          <Separator />
          <div>
            <Label className="text-xs text-muted-foreground">Type</Label>
            <p className="mt-0.5 font-mono text-xs">{selectedJob.type}</p>
          </div>
          <Separator />
          <div>
            <Label className="text-xs text-muted-foreground">Status</Label>
            <div className="mt-0.5">
              <Badge
                variant={statusProps(selectedJob.status ?? "").variant}
                className={cn(
                  "text-xs capitalize",
                  statusProps(selectedJob.status ?? "").className,
                )}
              >
                {String(selectedJob.status).toLowerCase()}
              </Badge>
            </div>
          </div>
          <Separator />
          <div>
            <Label className="text-xs text-muted-foreground">Attempts</Label>
            <p className="mt-0.5">
              {selectedJob.attempts} / {selectedJob.maxAttempts}
            </p>
          </div>
          {selectedJob.errorMessage ? (
            <>
              <Separator />
              <div>
                <Label className="text-xs text-muted-foreground">Error</Label>
                <p className="mt-0.5 text-destructive">
                  {scalarString(selectedJob.errorMessage)}
                </p>
              </div>
            </>
          ) : null}
          <Separator />
          <div>
            <Label className="text-xs text-muted-foreground">Payload</Label>
            <pre className="mt-0.5 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed">
              {JSON.stringify(selectedJob.payload, null, 2)}
            </pre>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Created at</Label>
              <p className="mt-0.5">{formatDateTime(selectedJob.createdAt)}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Updated at</Label>
              <p className="mt-0.5">{formatDateTime(selectedJob.updatedAt)}</p>
            </div>
            {selectedJob.startedAt ? (
              <div>
                <Label className="text-xs text-muted-foreground">
                  Started at
                </Label>
                <p className="mt-0.5">
                  {formatUnknownDateTime(selectedJob.startedAt)}
                </p>
              </div>
            ) : null}
            {selectedJob.completedAt ? (
              <div>
                <Label className="text-xs text-muted-foreground">
                  Completed at
                </Label>
                <p className="mt-0.5">
                  {formatUnknownDateTime(selectedJob.completedAt)}
                </p>
              </div>
            ) : null}
          </div>
          <Separator />
          <div>
            <Label className="text-xs text-muted-foreground">Created by</Label>
            <p className="mt-0.5 font-mono text-xs">
              {selectedJob.createdById ?? "System"}
            </p>
          </div>

          <Show when={isOpen}>
            <>
              <Separator />
              <div>
                <Label className="text-xs text-muted-foreground">
                  Event timeline
                </Label>
                <JobsEventTimeline
                  events={events}
                  isLoading={eventsLoading}
                  isError={eventsError}
                  onRetry={onRetryEvents}
                />
              </div>
            </>
          </Show>
        </div>
      ) : null}
    </ResourceDrawer>
  );
}
