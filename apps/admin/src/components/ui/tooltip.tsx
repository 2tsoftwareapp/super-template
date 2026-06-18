import * as React from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

const GAP = 8;

function Tooltip({
  content,
  children,
  side = "right",
}: {
  content: string;
  children: React.ReactNode;
  side?: "right" | "top" | "bottom" | "left";
}) {
  const [open, setOpen] = React.useState(false);
  const [coords, setCoords] = React.useState({ top: 0, left: 0 });
  const triggerRef = React.useRef<HTMLDivElement>(null);

  const updatePosition = React.useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    switch (side) {
      case "right":
        setCoords({ top: rect.top + rect.height / 2, left: rect.right + GAP });
        break;
      case "left":
        setCoords({ top: rect.top + rect.height / 2, left: rect.left - GAP });
        break;
      case "top":
        setCoords({ top: rect.top - GAP, left: rect.left + rect.width / 2 });
        break;
      case "bottom":
        setCoords({ top: rect.bottom + GAP, left: rect.left + rect.width / 2 });
        break;
    }
  }, [side]);

  React.useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  const transforms = {
    right: "-translate-y-1/2",
    left: "-translate-x-full -translate-y-1/2",
    top: "-translate-x-1/2 -translate-y-full",
    bottom: "-translate-x-1/2",
  };

  return (
    <div
      ref={triggerRef}
      className="flex"
      onMouseEnter={() => {
        updatePosition();
        setOpen(true);
      }}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
      {open
        ? createPortal(
            <span
              role="tooltip"
              className={cn(
                "pointer-events-none fixed z-50 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-sm",
                transforms[side],
              )}
              style={{ top: coords.top, left: coords.left }}
            >
              {content}
            </span>,
            document.body,
          )
        : null}
    </div>
  );
}

export { Tooltip };
