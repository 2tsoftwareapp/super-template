export function timeAgo(dateStr: string | undefined | null): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function statusProps(status: string): {
  variant: "default" | "secondary" | "outline";
  className?: string;
} {
  if (status === "ACTIVE") return { variant: "default" };
  if (status === "BLOCKED")
    return { variant: "outline", className: "text-destructive border-destructive/40" };
  return { variant: "secondary" };
}

export function formatDateTime(dateStr: string | undefined | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function truncateId(id: string, length = 8): string {
  if (id.length <= length) return id;
  return `${id.slice(0, length)}…`;
}
