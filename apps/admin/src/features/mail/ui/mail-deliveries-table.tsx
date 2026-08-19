"use client";

import { Badge } from "@repo/web-ui/badge";
import { Button } from "@repo/web-ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/web-ui/card";
import { ErrorState } from "@repo/web-ui/error-state";
import { Input } from "@repo/web-ui/input";
import { SectionLoading } from "@repo/web-ui/loading";
import { Pagination } from "@repo/web-ui/pagination";
import { Show } from "@repo/web-ui/show";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/web-ui/table";
import { RefreshCw } from "lucide-react";

import type { MailViewModel } from "@/features/mail/model/mail.types";
import type { MailDeliveryDto } from "@/lib/api-types";

import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

interface MailDeliveriesTableProps {
  deliveries: MailViewModel["deliveries"];
  onSelectDelivery: (delivery: MailDeliveryDto) => void;
}

export function MailDeliveriesTable({ deliveries, onSelectDelivery }: MailDeliveriesTableProps) {
  const {
    items,
    total,
    totalPages,
    page,
    pageSize,
    isFetching,
    isLoading,
    isError,
    onRetry,
    filters,
    statusOptions,
    statusProps,
    onFilterChange,
    onPageChange,
    onRefresh,
  } = deliveries;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Deliveries</CardTitle>
            <CardDescription className="text-xs">
              {total > 0
                ? `${total} deliver${total !== 1 ? "ies" : "y"}`
                : "History from the mail delivery endpoint."}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isFetching}>
            <RefreshCw className={cn("size-3.5", isFetching && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 pb-1">
        <div className="flex gap-2 border-b border-border px-4 py-3">
          <Input
            placeholder="Template key"
            value={filters.templateKey}
            onChange={(e) => onFilterChange("templateKey", e.target.value)}
            className="max-w-[180px]"
          />
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={filters.status}
            onChange={(e) => onFilterChange("status", e.target.value)}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            <Show when={isLoading}>
              <TableRow>
                <TableCell colSpan={5} className="py-16 text-center">
                  <SectionLoading />
                </TableCell>
              </TableRow>
            </Show>
            {!isLoading && isError ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8">
                  <ErrorState
                    variant="inline"
                    className="m-0"
                    title="Could not load deliveries."
                    action={{ label: "Retry", onClick: onRetry }}
                  />
                </TableCell>
              </TableRow>
            ) : null}
            {!isLoading && !isError && items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-16 text-center text-sm text-muted-foreground">
                  {filters.templateKey || filters.status
                    ? "No deliveries match your filters."
                    : "No deliveries recorded."}
                </TableCell>
              </TableRow>
            ) : null}
            {!isLoading && !isError
              ? items.map((delivery) => {
                  const { variant, className } = statusProps(String(delivery.status));
                  return (
                    <TableRow key={delivery.id}>
                      <TableCell className="max-w-[160px] truncate text-sm font-medium">
                        {delivery.subject}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {delivery.recipient}
                      </TableCell>
                      <TableCell>
                        <Badge variant={variant} className={cn("text-xs capitalize", className)}>
                          {String(delivery.status).toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {timeAgo(delivery.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => onSelectDelivery(delivery)}
                        >
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              : null}
          </TableBody>
        </Table>

        <Pagination
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          total={total}
          isLoading={isFetching}
          onPageChange={onPageChange}
        />
      </CardContent>
    </Card>
  );
}
