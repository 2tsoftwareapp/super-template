"use client";

import { Zap } from "lucide-react";

import { cn } from "@/lib/utils";

interface BrandProps {
  collapsed?: boolean;
}

export function Brand({ collapsed }: BrandProps) {
  return (
    <div
      className={cn("flex items-center gap-3", collapsed && "justify-center")}
    >
      <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-tr from-primary to-indigo-600 shadow-md shadow-primary/25 transition-transform hover:scale-105 duration-200">
        <Zap className="size-4 text-primary-foreground fill-primary-foreground/10" />
      </div>
      {!collapsed ? (
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold tracking-wider text-foreground uppercase">
            Super Admin
          </p>
          <p className="truncate text-[10px] text-muted-foreground/80 font-medium">
            Resource console
          </p>
        </div>
      ) : null}
    </div>
  );
}
