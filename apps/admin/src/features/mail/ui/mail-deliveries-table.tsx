"use client";

import { Badge } from "@repo/web-core/components/badge";
import { Button } from "@repo/web-core/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/web-core/components/card";
import { Input } from "@repo/web-core/components/input";
import { SectionLoading } from "@repo/web-core/components/loading";
import { Pagination } from "@repo/web-core/components/pagination";
import { Show } from "@repo/web-core/components/show";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/web-core/components/table";
import { RefreshCw } from "lucide-react";

import type { MailDeliveryDto } from "@/lib/api-types";

import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

import { type Filters, mailStatusProps } from "../model/mail-schemas";

interface MailDeliveriesTableProps {
  items: MailDeliveryDto[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
  isFetching: boolean;
  isLoading: boolean;
  filters: {
    templateKey: string;
    status: string;
  };
  onFilterChange: (key: keyof Filters, value: string | number) => void;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  onSelectDelivery: (delivery: MailDeliveryDto) => void;
}

export function MailDeliveriesTable({
  items,
  total,
  totalPages,
  page,
  pageSize,
  isFetching,
  isLoading,
  filters,
  onFilterChange,
  onPageChange,
  onRefresh,
  onSelectDelivery,
}: MailDeliveriesTableProps) {
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
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isFetching}
          >
            <RefreshCw
              className={cn(
                "size-3.5",
                isFetching && "animate-spin",
              )}
            />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 pb-1">
        <div className="flex gap-2 border-b border-border px-4 py-3">
          <Input
            placeholder="Template key"
            value={filters.templateKey}
            onChange={(e) =>
              onFilterChange("templateKey", e.target.value)
            }
            className="max-w-[180px]"
          />
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={filters.status}
            onChange={(e) => onFilterChange("status", e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="SENT">Sent</option>
            <option value="FAILED">Failed</option>
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
            {!isLoading && items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-16 text-center text-sm text-muted-foreground"
                >
                  {filters.templateKey || filters.status
                    ? "No deliveries match your filters."
                    : "No deliveries recorded."}
                </TableCell>
              </TableRow>
            ) : (
              items.map((delivery) => {
                const { variant, className } = mailStatusProps(
                  String(delivery.status),
                );
                return (
                  <TableRow key={delivery.id}>
                    <TableCell className="max-w-[160px] truncate text-sm font-medium">
                      {delivery.subject}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {delivery.recipient}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={variant}
                        className={cn("text-xs capitalize", className)}
                      >
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
            )}
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
