"use client";

import { cn } from "@repo/web-utils/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Calendar } from "./calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
}: {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const date = value ? new Date(value + "T00:00:00") : undefined;

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "inline-flex h-9 items-center justify-start gap-2 rounded-lg border border-input bg-background px-3 text-sm font-normal whitespace-nowrap text-left shadow-xs outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-hidden md:max-w-[150px]",
          !date && "text-muted-foreground",
          className,
        )}
      >
        <CalendarIcon className="size-3.5 shrink-0" />
        <span className="truncate">{date ? format(date, "PP") : placeholder}</span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => onChange(d ? format(d, "yyyy-MM-dd") : "")}
        />
      </PopoverContent>
    </Popover>
  );
}

export function DatePickerWithRange({
  value,
  onChange,
  className,
}: {
  value: { from: string; to: string };
  onChange: (range: { from: string; to: string }) => void;
  className?: string;
}) {
  const range = value.from || value.to
    ? {
        from: value.from ? new Date(value.from + "T00:00:00") : undefined,
        to: value.to ? new Date(value.to + "T00:00:00") : undefined,
      }
    : undefined;

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "inline-flex h-9 items-center justify-start gap-2 rounded-lg border border-input bg-background px-3 text-sm font-normal whitespace-nowrap text-left shadow-xs outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-hidden md:max-w-[220px]",
          !value.from && !value.to && "text-muted-foreground",
          className,
        )}
      >
        <CalendarIcon className="size-3.5 shrink-0" />
        <span className="truncate">
          {value.from && value.to
            ? `${format(new Date(value.from + "T00:00:00"), "LLL dd, y")} – ${format(new Date(value.to + "T00:00:00"), "LLL dd, y")}`
            : value.from
              ? `From ${format(new Date(value.from + "T00:00:00"), "PP")}`
              : value.to
                ? `Until ${format(new Date(value.to + "T00:00:00"), "PP")}`
                : "Pick date range"}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={range}
          onSelect={(r) =>
            onChange({
              from: r?.from ? format(r.from, "yyyy-MM-dd") : "",
              to: r?.to ? format(r.to, "yyyy-MM-dd") : "",
            })
          }
        />
      </PopoverContent>
    </Popover>
  );
}
