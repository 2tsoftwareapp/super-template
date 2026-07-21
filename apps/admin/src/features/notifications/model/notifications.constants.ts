export function notificationJobStatusProps(status: string): {
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
  if (status === "CANCELLED") return { variant: "outline" };
  return { variant: "outline" };
}

export function normalizeJobStatus(status: unknown): string {
  return typeof status === "string" ? status : "UNKNOWN";
}
