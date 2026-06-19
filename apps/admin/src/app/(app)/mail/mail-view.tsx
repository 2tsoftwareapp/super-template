"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import type {
  ListResponse,
  MailDeliveryDto,
  MailPreviewDto,
} from "@/lib/api-types";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { timeAgo } from "@/lib/format";
import { webFetch } from "@/lib/http";
import { cn } from "@/lib/utils";

function mailStatusProps(status: string): {
  variant: "default" | "secondary" | "outline";
  className?: string;
} {
  if (status === "SENT") return { variant: "default" };
  if (status === "FAILED")
    return {
      variant: "outline",
      className: "text-destructive border-destructive/40",
    };
  return { variant: "secondary" };
}

export function MailView() {
  const [templateKey, setTemplateKey] = useState("welcome");

  const deliveries = useQuery({
    queryKey: ["admin-mail-deliveries"],
    queryFn: () =>
      webFetch<ListResponse<MailDeliveryDto>>(
        "/api/bff/admin/mail/deliveries?limit=50",
      ),
  });

  const preview = useQuery({
    queryKey: ["admin-mail-preview", templateKey],
    queryFn: () =>
      webFetch<{ data: MailPreviewDto }>(
        `/api/bff/admin/mail/preview/${encodeURIComponent(templateKey)}`,
      ),
    enabled: Boolean(templateKey),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        label="Mail"
        title="Mail workspace"
        description="Review delivery history and render templates through the API."
      />
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        {/* Template preview */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Template preview</CardTitle>
            <CardDescription className="text-xs">
              Look up a template key and inspect subject / body.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                className="flex-1"
                value={templateKey}
                onChange={(e) => setTemplateKey(e.target.value)}
                placeholder="Template key (e.g. welcome)"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => void preview.refetch()}
                disabled={preview.isFetching}
              >
                {preview.isFetching ? (
                  <Spinner className="size-3.5" />
                ) : (
                  "Preview"
                )}
              </Button>
            </div>

            <div className="rounded-xl border border-border p-4 text-sm">
              {preview.isLoading ? (
                <div className="flex justify-center py-4">
                  <Spinner className="size-4" />
                </div>
              ) : preview.data?.data ? (
                <>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Subject
                  </p>
                  <p className="mt-1 font-semibold">
                    {preview.data.data.subject}
                  </p>
                  <Separator className="my-3" />
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Body
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
                    {preview.data.data.text}
                  </p>
                </>
              ) : (
                <p className="py-2 text-center text-xs text-muted-foreground">
                  {templateKey
                    ? "Template not found."
                    : "Enter a template key above."}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Deliveries */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Deliveries</CardTitle>
            <CardDescription className="text-xs">
              {deliveries.data
                ? `${deliveries.data.data.length} recent deliveries`
                : "History from the mail delivery endpoint."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 pb-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-16 text-center">
                      <Spinner className="mx-auto size-5" />
                    </TableCell>
                  </TableRow>
                ) : (deliveries.data?.data ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-16 text-center text-sm text-muted-foreground"
                    >
                      No deliveries recorded.
                    </TableCell>
                  </TableRow>
                ) : (
                  (deliveries.data?.data ?? []).map((delivery) => {
                    const { variant, className } = mailStatusProps(
                      delivery.status,
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
                            {delivery.status.toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {timeAgo(delivery.createdAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
