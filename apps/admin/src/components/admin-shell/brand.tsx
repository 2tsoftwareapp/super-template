"use client";

import { Zap } from "lucide-react";

import { cn } from "@/lib/utils";

interface BrandProps {
  collapsed?: boolean;
}

export function Brand({ collapsed }: BrandProps) {
  return (
    <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
      <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary/90 to-emerald-500 shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30 hover:scale-105 duration-200">
        <Zap className="size-4 text-primary-foreground" strokeWidth={2.5} />
      </div>
      {!collapsed ? (
        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold tracking-widest text-foreground uppercase">
            Super Admin
          </p>
          <p className="truncate text-[10px] text-muted-foreground font-medium">Control center</p>
        </div>
      ) : null}
    </div>
  );
}
