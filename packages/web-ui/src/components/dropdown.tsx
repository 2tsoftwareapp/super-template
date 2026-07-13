"use client";

import { cn } from "@repo/web-utils/utils";
import * as React from "react";

type DropdownItem =
  | { separator: true }
  | {
      separator?: false;
      label: string;
      icon?: React.ReactNode;
      onClick?: () => void;
      destructive?: boolean;
    };

function Dropdown({
  trigger,
  items,
  align = "end",
}: {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: "start" | "end";
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen((v) => !v)} className="cursor-pointer">
        {trigger}
      </div>
      {open ? (
        <div
          className={cn(
            "absolute top-full z-50 mt-1 min-w-48 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-lg",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          {items.map((item, i) =>
            item.separator === true ? (
              <div key={i} className="my-1 h-px bg-border" />
            ) : (
              <button
                key={i}
                type="button"
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                  item.destructive
                    ? "text-destructive hover:bg-destructive/10"
                    : "text-foreground hover:bg-accent",
                )}
                onClick={() => {
                  item.onClick?.();
                  setOpen(false);
                }}
              >
                {item.icon}
                {item.label}
              </button>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}

export { Dropdown, type DropdownItem };
