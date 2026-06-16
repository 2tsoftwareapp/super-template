import * as React from "react";
import { cn } from "@/lib/utils";

function Tooltip({
  content,
  children,
  side = "right",
}: {
  content: string;
  children: React.ReactNode;
  side?: "right" | "top" | "bottom" | "left";
}) {
  const positions = {
    right: "left-full ml-2 top-1/2 -translate-y-1/2",
    left: "right-full mr-2 top-1/2 -translate-y-1/2",
    top: "bottom-full mb-2 left-1/2 -translate-x-1/2",
    bottom: "top-full mt-2 left-1/2 -translate-x-1/2",
  };
  return (
    <div className="group relative flex">
      {children}
      <span
        className={cn(
          "pointer-events-none absolute z-50 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100",
          positions[side],
        )}
      >
        {content}
      </span>
    </div>
  );
}

export { Tooltip };
