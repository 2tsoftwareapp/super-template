import type { ReactNode } from "react";

import { Button } from "./ui/button";

export function BulkActionBar({
  selectedCount,
  actions,
  onClear,
}: {
  selectedCount: number;
  actions?: ReactNode;
  onClear: () => void;
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex flex-col gap-3 border-b border-border bg-muted/40 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between md:px-5">
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
