export {
  formatBytes,
  formatDateTime,
  formatUnknownDateTime,
  scalarString,
  timeAgo,
  truncateId,
} from "@repo/web-utils/format";

export function statusProps(status: string): {
  variant: "default" | "secondary" | "outline";
  className?: string;
} {
  if (status === "ACTIVE") return { variant: "default" };
  if (status === "BLOCKED")
    return {
      variant: "outline",
      className: "text-destructive border-destructive/40",
    };
  return { variant: "secondary" };
}
