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
