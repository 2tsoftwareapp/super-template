import { type ReactNode } from "react";

import { cn } from "@repo/web-utils/utils";

import { Button } from "../components/button";
import { useAnimatePresence } from "../hooks/use-animate-presence";

export function BulkActionBar({
  selectedCount,
  actions,
  onClear,
}: {
  selectedCount: number;
  actions?: ReactNode;
  onClear: () => void;
}) {
  const { visible, animate } = useAnimatePresence(selectedCount > 0);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-border bg-muted/40 px-4 py-3 text-sm transition-all duration-200 md:flex-row md:items-center md:justify-between md:px-5",
        animate ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
      )}
    >
      <p className="font-medium tabular-nums">
        {selectedCount} {selectedCount === 1 ? "record" : "records"} selected
      </p>
      <div className="flex flex-wrap gap-2">
        {actions}
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear selection
        </Button>
      </div>
    </div>
  );
}
