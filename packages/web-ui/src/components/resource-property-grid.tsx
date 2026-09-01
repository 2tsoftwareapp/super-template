"use client";

import { cn } from "@repo/web-utils/utils";
import { Check, Copy, ExternalLink } from "lucide-react";
import { type ComponentProps, type ReactNode, useCallback, useState } from "react";

import { Badge } from "./badge";
import { Button } from "./button";

export interface CopyableBadgeProps extends ComponentProps<"div"> {
  value: string;
  label?: string | undefined;
  copyValue?: string | undefined;
  truncated?: boolean | undefined;
  maxLength?: number | undefined;
  variant?: "default" | "secondary" | "outline" | "ghost" | undefined;
}

export function CopyableBadge({
  value,
  label,
  copyValue,
  truncated = false,
  maxLength = 16,
  variant: _variant = "secondary",
  className,
  ...props
}: CopyableBadgeProps) {
  const [copied, setCopied] = useState(false);
  const textToCopy = copyValue ?? value;

  const handleCopy = useCallback(async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {
      // Fallback or ignore clipboard permission error
    }
  }, [textToCopy]);

  const displayValue =
    truncated && value.length > maxLength
      ? `${value.slice(0, Math.ceil(maxLength / 2))}...${value.slice(-Math.floor(maxLength / 2))}`
      : value;

  return (
    <div
      className={cn(
        "group/copyable inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-2.5 py-1 text-xs font-mono text-foreground transition-colors hover:bg-muted/70",
        className,
      )}
      {...props}
    >
      <span className="select-all" title={label ?? value}>
        {displayValue}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? "Copied" : `Copy ${label ?? value}`}
        className="rounded p-0.5 text-muted-foreground/70 transition-colors hover:bg-background hover:text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
      >
        {copied ? (
          <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <Copy className="size-3" />
        )}
      </button>
    </div>
  );
}

export interface JsonCodeBlockProps extends ComponentProps<"div"> {
  data: unknown;
  maxHeight?: string | undefined;
  collapsible?: boolean | undefined;
  defaultExpanded?: boolean | undefined;
}

export function JsonCodeBlock({
  data,
  maxHeight = "360px",
  collapsible = false,
  defaultExpanded = true,
  className,
  ...props
}: JsonCodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(defaultExpanded);

  const formattedJson = typeof data === "string" ? data : JSON.stringify(data, null, 2);

  const handleCopy = useCallback(async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(formattedJson);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {
      // Ignore clipboard errors
    }
  }, [formattedJson]);

  return (
    <div
      className={cn(
        "relative rounded-lg border border-border/80 bg-muted/50 font-mono text-xs shadow-2xs",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-1.5 text-muted-foreground">
        <span className="text-[11px] font-semibold uppercase tracking-wider">JSON Payload</span>
        <div className="flex items-center gap-1">
          {collapsible ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[11px]"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Collapse" : "Expand"}
            </Button>
          ) : null}
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? "Copied JSON" : "Copy JSON"}
            className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          >
            {copied ? (
              <>
                <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="size-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {expanded ? (
        <pre
          className="overflow-x-auto p-3 text-foreground/90 leading-relaxed"
          style={{ maxHeight }}
        >
          <code>{formattedJson}</code>
        </pre>
      ) : null}
    </div>
  );
}

export interface StatusBadgeProps extends ComponentProps<"span"> {
  status: string;
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "success"
    | "warning"
    | "info"
    | undefined;
  dot?: boolean | undefined;
}

const statusVariantsMap: Record<
  string,
  { bg: string; text: string; dot: string; border?: string }
> = {
  success: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
    border: "border-emerald-500/20",
  },
  warning: {
    bg: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
    border: "border-amber-500/20",
  },
  destructive: {
    bg: "bg-rose-500/10",
    text: "text-rose-700 dark:text-rose-400",
    dot: "bg-rose-500",
    border: "border-rose-500/20",
  },
  info: {
    bg: "bg-sky-500/10",
    text: "text-sky-700 dark:text-sky-400",
    dot: "bg-sky-500",
    border: "border-sky-500/20",
  },
  secondary: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground",
    border: "border-border",
  },
  default: {
    bg: "bg-primary/10",
    text: "text-primary",
    dot: "bg-primary",
    border: "border-primary/20",
  },
  outline: {
    bg: "bg-transparent",
    text: "text-foreground",
    dot: "bg-foreground/60",
    border: "border-border",
  },
};

const defaultStatusConfig = {
  bg: "bg-primary/10",
  text: "text-primary",
  dot: "bg-primary",
  border: "border-primary/20",
};

export function StatusBadge({
  status,
  variant = "default",
  dot = true,
  className,
  ...props
}: StatusBadgeProps) {
  const config =
    variant && statusVariantsMap[variant]
      ? statusVariantsMap[variant]
      : (statusVariantsMap.default ?? defaultStatusConfig);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.bg,
        config.text,
        config.border,
        className,
      )}
      {...props}
    >
      {dot ? <span className={cn("size-1.5 rounded-full", config.dot)} aria-hidden="true" /> : null}
      <span className="capitalize">{status}</span>
    </span>
  );
}

export interface TimestampValueProps extends ComponentProps<"time"> {
  value: string | number | Date;
  format?: "dateTime" | "date" | "time" | "iso" | undefined;
}

export function TimestampValue({
  value,
  format = "dateTime",
  className,
  ...props
}: TimestampValueProps) {
  const date = typeof value === "object" && value instanceof Date ? value : new Date(value);
  const isValidDate = !Number.isNaN(date.getTime());

  if (!isValidDate) {
    return <span className={cn("text-muted-foreground", className)}>{String(value)}</span>;
  }

  const isoString = date.toISOString();

  let formattedText = isoString;
  if (format === "date") {
    formattedText = date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } else if (format === "time") {
    formattedText = date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } else if (format === "dateTime") {
    formattedText = date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  return (
    <time
      dateTime={isoString}
      title={isoString}
      className={cn("tabular-nums text-foreground/90", className)}
      {...props}
    >
      {formattedText}
    </time>
  );
}

export interface ResourcePropertyItem {
  key?: string | undefined;
  label: string;
  value?: unknown;
  type?:
    | "text"
    | "id"
    | "badge"
    | "status"
    | "timestamp"
    | "json"
    | "code"
    | "link"
    | "custom"
    | undefined;
  copyable?: boolean | undefined;
  copyValue?: string | undefined;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link" | undefined;
  statusVariant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "success"
    | "warning"
    | "info"
    | undefined;
  href?: string | undefined;
  colSpan?: 1 | 2 | "full" | undefined;
  description?: string | undefined;
  className?: string | undefined;
  placeholder?: string | undefined;
}

export interface ResourcePropertyGridProps {
  properties?: ResourcePropertyItem[] | undefined;
  items?: ResourcePropertyItem[] | undefined;
  columns?: 1 | 2 | 3 | 4 | undefined;
  density?: "compact" | "default" | "relaxed" | undefined;
  className?: string | undefined;
  emptyText?: string | undefined;
}

const densityClasses = {
  compact: "gap-x-4 gap-y-2.5 text-xs",
  default: "gap-x-6 gap-y-4 text-sm",
  relaxed: "gap-x-8 gap-y-6 text-sm",
};

const columnGridClasses: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

export function ResourcePropertyGrid({
  properties,
  items,
  columns = 2,
  density = "default",
  className,
  emptyText = "—",
}: ResourcePropertyGridProps) {
  const propertyList = properties ?? items ?? [];

  if (!propertyList.length) {
    return null;
  }

  const gridColClass = columnGridClasses[columns] ?? columnGridClasses[2];

  return (
    <div
      className={cn("grid", gridColClass, densityClasses[density], className)}
      data-testid="resource-property-grid"
    >
      {propertyList.map((item, index) => {
        const itemKey = item.key ?? `${item.label}-${index}`;
        const isFullSpan = item.colSpan === 2 || item.colSpan === "full" || item.type === "json";

        return (
          <div
            key={itemKey}
            className={cn(
              "flex flex-col gap-1 min-w-0",
              isFullSpan && (columns >= 2 ? "sm:col-span-2" : ""),
              item.className,
            )}
          >
            <span className="text-xs font-medium text-muted-foreground">{item.label}</span>

            <div className="min-w-0">
              <PropertyValueRenderer item={item} emptyText={emptyText} />
            </div>

            {item.description ? (
              <p className="text-[11px] text-muted-foreground/80 leading-normal">
                {item.description}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function PropertyValueRenderer({
  item,
  emptyText,
}: {
  item: ResourcePropertyItem;
  emptyText: string;
}) {
  const { value, type = "text", copyable, copyValue, placeholder } = item;

  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground">{placeholder ?? emptyText}</span>;
  }

  const stringVal =
    typeof value === "string"
      ? value
      : typeof value === "number" || typeof value === "boolean" || typeof value === "bigint"
        ? String(value)
        : "";

  if (type === "id") {
    return (
      <CopyableBadge
        value={stringVal}
        label={item.label}
        {...(copyValue !== undefined ? { copyValue } : {})}
        truncated={item.colSpan !== "full"}
      />
    );
  }

  if (type === "json") {
    return <JsonCodeBlock data={value} />;
  }

  if (type === "status") {
    return <StatusBadge status={stringVal} variant={item.statusVariant ?? "default"} />;
  }

  if (type === "badge") {
    return (
      <Badge variant={item.badgeVariant ?? "secondary"}>
        {typeof value === "string" || typeof value === "number" ? value : (value as ReactNode)}
      </Badge>
    );
  }

  if (type === "timestamp") {
    return <TimestampValue value={value as string | number | Date} />;
  }

  if (type === "link" && item.href) {
    return (
      <a
        href={item.href}
        className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
      >
        <span>{stringVal !== "" ? stringVal : (value as ReactNode)}</span>
        <ExternalLink className="size-3 shrink-0" />
      </a>
    );
  }

  if (type === "code") {
    return (
      <code className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-xs text-foreground">
        {stringVal !== "" ? stringVal : (value as ReactNode)}
      </code>
    );
  }

  if (copyable && typeof value === "string") {
    return (
      <div className="flex items-center gap-2">
        <span className="font-medium text-foreground">{value}</span>
        <CopyableBadge
          value={value}
          label={item.label}
          {...(copyValue !== undefined ? { copyValue } : {})}
        />
      </div>
    );
  }

  return <div className="font-medium text-foreground break-words">{value as ReactNode}</div>;
}
