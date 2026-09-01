"use client";

import { ErrorState } from "@repo/web-ui/error-state";
import { Label } from "@repo/web-ui/label";
import { ResourceDetailPane } from "@repo/web-ui/resource-detail-pane";
import {
  ResourcePropertyGrid,
  type ResourcePropertyItem,
} from "@repo/web-ui/resource-property-grid";
import { Separator } from "@repo/web-ui/separator";

import type { JobDto, JobEventDto } from "@/lib/api-types";

import { JobsEventTimeline } from "@/features/jobs/ui/jobs-event-timeline";
import { scalarString } from "@/lib/format";

export interface JobsDetailProps {
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

export function JobsDetailContent({
  selectedJob,
  events,
  eventsLoading,
  eventsError,
  onRetryEvents,
  statusProps,
}: {
  selectedJob: JobDto;
  events: JobEventDto[];
  eventsLoading: boolean;
  eventsError: boolean;
  onRetryEvents: () => void;
  statusProps: (status: string) => {
    variant: "default" | "secondary" | "outline";
    className?: string;
  };
}) {
  const statusInfo = statusProps(selectedJob.status ?? "");
  const properties: ResourcePropertyItem[] = [
    {
      label: "ID",
      value: selectedJob.id,
      type: "id",
      copyable: true,
    },
    {
      label: "Type",
      value: selectedJob.type,
    },
    {
      label: "Status",
      value: String(selectedJob.status ?? "").toLowerCase(),
      type: "badge",
      badgeVariant: statusInfo.variant,
    },
    {
      label: "Attempts",
      value: `${selectedJob.attempts} / ${selectedJob.maxAttempts}`,
    },
    {
      label: "Created by",
      value: selectedJob.createdById ?? "System",
      type: "id",
      copyable: Boolean(selectedJob.createdById),
    },
    {
      label: "Created at",
      value: selectedJob.createdAt,
      type: "timestamp",
    },
    {
      label: "Updated at",
      value: selectedJob.updatedAt,
      type: "timestamp",
    },
  ];

  if (selectedJob.startedAt) {
    properties.push({
      label: "Started at",
      value: selectedJob.startedAt,
      type: "timestamp",
    });
  }

  if (selectedJob.completedAt) {
    properties.push({
      label: "Completed at",
      value: selectedJob.completedAt,
      type: "timestamp",
    });
  }

  if (selectedJob.errorMessage) {
    properties.push({
      label: "Error",
      value: scalarString(selectedJob.errorMessage),
      colSpan: "full",
      className: "text-destructive",
    });
  }

  if (selectedJob.payload && Object.keys(selectedJob.payload).length > 0) {
    properties.push({
      label: "Payload",
      value: selectedJob.payload,
      type: "json",
      colSpan: "full",
    });
  }

  return (
    <div className="space-y-6 text-sm">
      <ResourcePropertyGrid properties={properties} columns={2} density="default" />

      <Separator />

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Execution timeline
        </Label>
        <JobsEventTimeline
          events={events}
          isLoading={eventsLoading}
          isError={eventsError}
          onRetry={onRetryEvents}
        />
      </div>
    </div>
  );
}

export function JobsDetailPane({
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
}: JobsDetailProps) {
  return (
    <ResourceDetailPane
      open={isOpen}
      title="Job detail"
      description={selectedJob ? `Type: ${selectedJob.type}` : "Job details"}
      id={selectedJob?.id}
      loading={detailLoading && !selectedJob}
      error={
        !detailLoading && detailError && !selectedJob ? (
          <ErrorState
            variant="inline"
            title="Could not load job detail."
            action={{ label: "Retry", onClick: onRetryDetail }}
          />
        ) : undefined
      }
      onClose={onClose}
    >
      {selectedJob ? (
        <JobsDetailContent
          selectedJob={selectedJob}
          events={events}
          eventsLoading={eventsLoading}
          eventsError={eventsError}
          onRetryEvents={onRetryEvents}
          statusProps={statusProps}
        />
      ) : null}
    </ResourceDetailPane>
  );
}
