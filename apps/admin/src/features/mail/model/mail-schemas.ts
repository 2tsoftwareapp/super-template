export const DELIVERY_PAGE_SIZE = 20;

export interface Filters {
  status: string;
  templateKey: string;
  page: number;
}

export function parseFilters(sp: URLSearchParams): Filters {
  return {
    status: sp.get("status") ?? "",
    templateKey: sp.get("templateKey") ?? "",
    page: Math.max(1, Number(sp.get("page")) || 1),
  };
}

export function mailStatusProps(status: string): {
  variant: "default" | "secondary" | "outline";
  className?: string;
} {
  if (status === "SENT")
    return {
      variant: "default",
      className: "bg-primary/15 text-primary border-primary/30",
    };
  if (status === "FAILED")
    return {
      variant: "outline",
      className: "text-destructive border-destructive/40",
    };
  return { variant: "secondary" };
}
