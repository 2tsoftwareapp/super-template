import { Button } from "@repo/web-core/components/button";
import { type ReactNode, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export function BulkActionBar({
  selectedCount,
  actions,
  onClear,
}: {
  selectedCount: number;
  actions?: ReactNode;
  onClear: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (selectedCount > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mount animation on selection
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimate(true));
      });
    } else {
      setAnimate(false);
      const timer = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [selectedCount]);

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
