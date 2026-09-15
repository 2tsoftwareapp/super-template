export const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FAILED", label: "Failed" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

export const EVENT_STYLES: Record<string, { label: string; dot: string; text: string }> = {
  claimed: {
    label: "Claimed",
    dot: "bg-chart-5",
    text: "text-muted-foreground",
  },
  completed: { label: "Completed", dot: "bg-primary", text: "text-primary" },
  failed: {
    label: "Failed",
    dot: "bg-destructive",
    text: "text-destructive",
  },
  // Not a terminal job status: the worker hit an error before recording one, so
  // the job is still PROCESSING and stale-lease recovery will re-claim it. Same
  // error tone as `failed`, but the label says what actually happened.
  processing_error: {
    label: "Processing error",
    dot: "bg-destructive",
    text: "text-destructive",
  },
  retry_scheduled: {
    label: "Retry scheduled",
    dot: "bg-chart-2",
    text: "text-chart-2",
  },
  cancelled: {
    label: "Cancelled",
    dot: "bg-muted-foreground",
    text: "text-muted-foreground",
  },
  // Recorded on the *dependent* job when PropagationService parks it as BLOCKED
  // because a job it depends on reached a blocking status. Same failure tone as
  // `failed`; the event message names the dependency that failed.
  dependency_failed: {
    label: "Dependency failed",
    dot: "bg-destructive",
    text: "text-destructive",
  },
  // Recorded when the worker found no handler for the job type and marked the
  // job FAILED; same failure tone as `failed`.
  no_handler: {
    label: "No handler",
    dot: "bg-destructive",
    text: "text-destructive",
  },
};

export function jobStatusProps(status: string): {
  variant: "default" | "secondary" | "outline";
  className?: string;
} {
  if (status === "COMPLETED") return { variant: "default" };
  if (status === "PENDING") return { variant: "secondary" };
  if (status === "PROCESSING")
    return {
      variant: "secondary",
      className: "bg-accent text-accent-foreground border-border",
    };
  if (status === "FAILED")
    return {
      variant: "outline",
      className: "text-destructive border-destructive/40",
    };
  if (status === "CANCELLED")
    return {
      variant: "outline",
      className: "text-muted-foreground border-muted-foreground/30",
    };
  return { variant: "outline" };
}

export function eventTypeProps(type: string) {
  return (
    EVENT_STYLES[type] ?? {
      label: type,
      dot: "bg-muted-foreground",
      text: "text-muted-foreground",
    }
  );
}
