import { Badge } from "@/components/ui/badge";

const VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default",
  DONE: "default",
  PENDING: "secondary",
  PROCESSING: "secondary",
  BLOCKED: "destructive",
  FAILED: "destructive",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={VARIANTS[status] ?? "outline"}>{status}</Badge>;
}
