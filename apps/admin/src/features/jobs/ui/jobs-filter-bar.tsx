"use client";

import { Button } from "@repo/web-ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/web-ui/card";
import { RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";

interface StatusOption {
  value: string;
  label: string;
}

interface JobsFilterBarProps {
  status: string;
  type: string;
  statusOptions: readonly StatusOption[];
  onStatusChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onRefresh: () => void;
  isFetching: boolean;
}

export function JobsFilterBar({
  status,
  type,
  statusOptions,
  onStatusChange,
  onTypeChange,
  onRefresh,
  isFetching,
}: JobsFilterBarProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Filters</CardTitle>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isFetching}>
            <RefreshCw className={cn("size-3.5", isFetching && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 pb-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <select
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-hidden transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Type</label>
          <input
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-hidden transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            placeholder="e.g. SEND_NOTIFICATION"
            value={type}
            onChange={(e) => onTypeChange(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
