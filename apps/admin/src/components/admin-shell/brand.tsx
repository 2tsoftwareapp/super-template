"use client";

import { Zap } from "lucide-react";

export function Brand() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary/90 to-emerald-500 shadow-lg shadow-primary/20">
        <Zap className="size-4 text-primary-foreground" strokeWidth={2.5} />
      </div>
      <div className="min-w-0 overflow-hidden transition-all duration-200 group-data-[collapsible=icon]:w-0">
        <p className="truncate text-[11px] font-bold tracking-widest text-foreground uppercase">
          Super Admin
        </p>
        <p className="truncate text-[10px] text-muted-foreground font-medium">Control center</p>
      </div>
    </div>
  );
}
