"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import type {
  ListResponse,
  MailDeliveryDto,
  MailPreviewDto,
  MailTemplateDto,
  SendAdminMailResultDto,
} from "@/lib/api-types";

import { ResourceDrawer } from "@/components/resource-drawer";
import { ResourcePageShell } from "@/components/resource-page-shell";
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
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
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
import { adminResources } from "@/lib/admin-resources";
import { formatDateTime, formatUnknownDateTime, scalarString, timeAgo } from "@/lib/format";
import { webFetch } from "@/lib/http";
import { cn } from "@/lib/utils";

function mailStatusProps(status: string): {
  variant: "default" | "secondary" | "outline";
  className?: string;
} {
  if (status === "SENT")
    return {
      variant: "default",
      className: "bg-primary/15 text-primary border-primary/30",
    };
  if (status === "FAILED")
    return {
      variant: "outline",
      className: "text-destructive border-destructive/40",
    };
  return { variant: "secondary" };
}

interface Filters {
  status: string;
  templateKey: string;
  page: number;
}

function parseFilters(sp: URLSearchParams): Filters {
  return {
    status: sp.get("status") ?? "",
    templateKey: sp.get("templateKey") ?? "",
    page: Math.max(1, Number(sp.get("page")) || 1),
  };
}

const mailResource = adminResources.find((r) => r.id === "mail")!;

const DELIVERY_PAGE_SIZE = 20;

export function MailView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [filters, setFilters] = useState<Filters>(() =>
    parseFilters(new URLSearchParams(searchParams.toString())),
  );

  const updateFilter = (key: keyof Filters, value: string | number) => {
    const next = { ...filters, [key]: value };
    if (key !== "page") next.page = 1;
    setFilters(next);
    const sp = new URLSearchParams();
    if (next.status) sp.set("status", next.status);
    if (next.templateKey) sp.set("templateKey", next.templateKey);
    if (next.page > 1) sp.set("page", String(next.page));
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const queryClient = useQueryClient();
  const [templateKey, setTemplateKey] = useState("auth.welcome");
  const [selectedDelivery, setSelectedDelivery] = useState<MailDeliveryDto | null>(null);

  // Send form state
  const [sendTemplateKey, setSendTemplateKey] = useState("");
  const [sendRecipient, setSendRecipient] = useState("");
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [sendIdempotencyKey, setSendIdempotencyKey] = useState("");

  const templates = useQuery({
    queryKey: ["admin-mail-templates"],
    queryFn: () =>
      webFetch<{ data: MailTemplateDto[] }>(
        "/api/bff/admin/mail/templates",
      ),
  });

  const selectedTemplate = sendTemplateKey
    ? (templates.data?.data ?? []).find((t) => t.key === sendTemplateKey)
    : undefined;

  const handleTemplateChange = (key: string) => {
    setSendTemplateKey(key);
    const tmpl = (templates.data?.data ?? []).find((t) => t.key === key);
    setVariableValues(Object.fromEntries((tmpl?.variables ?? []).map((v) => [v, ""])));
  };

  const deliveries = useQuery({
    queryKey: ["admin-mail-deliveries", filters.templateKey, filters.status, filters.page],
    queryFn: () => {
      const params = new URLSearchParams({
        limit: String(DELIVERY_PAGE_SIZE),
        page: String(filters.page),
      });
      if (filters.templateKey) params.set("templateKey", filters.templateKey);
      if (filters.status) params.set("status", filters.status);
      return webFetch<ListResponse<MailDeliveryDto>>(
        `/api/bff/admin/mail/deliveries?${params.toString()}`,
      );
    },
  });

  const total = deliveries.data?.meta?.total ?? 0;
  const totalPages = deliveries.data?.meta?.totalPages ?? 1;

  const preview = useQuery({
    queryKey: ["admin-mail-preview", templateKey],
    queryFn: () =>
      webFetch<{ data: MailPreviewDto }>(
        `/api/bff/admin/mail/preview/${encodeURIComponent(templateKey)}`,
      ),
    enabled: Boolean(templateKey),
  });

  const sendMail = useMutation({
    mutationFn: () => {
      return webFetch<{ data: SendAdminMailResultDto }>("/api/bff/admin/mail/send", {
        method: "POST",
        body: JSON.stringify({
          templateKey: sendTemplateKey,
          to: sendRecipient,
          variables: variableValues,
          ...(sendIdempotencyKey
            ? { idempotencyKey: sendIdempotencyKey }
            : {}),
        }),
      });
    },
    onSuccess: async (result) => {
      toast.success(`Mail queued (job: ${result?.data?.jobId ?? "—"})`);
      setSendTemplateKey("");
      setSendRecipient("");
      setVariableValues({});
      setSendIdempotencyKey("");
      await queryClient.invalidateQueries({ queryKey: ["admin-mail-deliveries"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to send mail");
    },
  });

  return (
    <ResourcePageShell
      resource={mailResource}
      description="Review delivery history, browse templates, and send test emails."
      isRefreshing={templates.isFetching || deliveries.isFetching}
      onRefresh={() => {
        void templates.refetch();
        void deliveries.refetch();
      }}
    >
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
                placeholder="Template key (e.g. auth.welcome)"
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
              ) : preview.isError ? (
                <div className="space-y-2 py-2 text-sm">
                  <p className="font-medium text-destructive">
                    Preview unavailable.
                  </p>
                  <p className="text-muted-foreground">
                    {preview.error instanceof Error
                      ? preview.error.message
                      : "The template key is invalid or the preview endpoint is unavailable."}
                  </p>
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
                  {preview.data.data.missingVariables?.length > 0 && (
                    <>
                      <Separator className="my-3" />
                      <p className="text-xs font-medium uppercase tracking-wide text-accent-foreground">
                        Missing variables
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {preview.data.data.missingVariables.join(", ")}
                      </p>
                    </>
                  )}
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

        {/* Template catalog */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Template catalog</CardTitle>
            <CardDescription className="text-xs">
              {templates.data
                ? `${templates.data.data.length} templates available`
                : "All registered mail templates."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 pb-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Mandatory</TableHead>
                  <TableHead>Sendable</TableHead>
                  <TableHead>Variables</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-16 text-center">
                      <Spinner className="mx-auto size-5" />
                    </TableCell>
                  </TableRow>
                ) : (templates.data?.data ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-16 text-center text-sm text-muted-foreground"
                    >
                      No templates found.
                    </TableCell>
                  </TableRow>
                ) : (
                  (templates.data?.data ?? []).map((tmpl) => (
                    <TableRow
                      key={tmpl.key}
                      className="cursor-pointer"
                      onClick={() => setTemplateKey(tmpl.key)}
                    >
                      <TableCell className="font-mono text-xs">
                        {tmpl.key}
                      </TableCell>
                      <TableCell>
                        {tmpl.mandatory ? (
                          <Badge
                            variant="outline"
                            className="text-xs text-accent-foreground border-border"
                          >
                            Yes
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            No
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {tmpl.sendable ? (
                          <Badge
                            variant="default"
                            className="text-xs bg-primary/15 text-primary"
                          >
                            Yes
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            No
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {tmpl.variables.length > 0
                          ? tmpl.variables.join(", ")
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Send mail */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Send test mail</CardTitle>
          <CardDescription className="text-xs">
            Send an ad-hoc email using a sendable template.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Template key
              </Label>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={sendTemplateKey}
                onChange={(e) => handleTemplateChange(e.target.value)}
              >
                <option value="">Select a template</option>
                {(templates.data?.data ?? [])
                  .filter((t) => t.sendable)
                  .map((tmpl) => (
                    <option key={tmpl.key} value={tmpl.key}>
                      {tmpl.key}
                    </option>
                  ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Recipient email
              </Label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={sendRecipient}
                onChange={(e) => setSendRecipient(e.target.value)}
              />
            </div>
            {selectedTemplate?.variables && selectedTemplate.variables.length > 0 && (
              <div className="space-y-3 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">
                  Variables
                </Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {selectedTemplate.variables.map((varName) => (
                    <div key={varName} className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground font-mono">
                        {varName}
                      </Label>
                      <Input
                        placeholder={`Value for ${varName}`}
                        value={variableValues[varName] ?? ""}
                        onChange={(e) =>
                          setVariableValues((prev) => ({
                            ...prev,
                            [varName]: e.target.value,
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Idempotency key (optional)
              </Label>
              <Input
                placeholder="uuid or unique string"
                value={sendIdempotencyKey}
                onChange={(e) => setSendIdempotencyKey(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              size="sm"
              onClick={() => sendMail.mutate()}
              disabled={sendMail.isPending || !sendTemplateKey || !sendRecipient}
            >
              {sendMail.isPending ? (
                <>
                  <Spinner className="mr-1.5 size-3.5" />
                  Sending…
                </>
              ) : (
                "Send mail"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Deliveries */}
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
              onClick={() => deliveries.refetch()}
              disabled={deliveries.isFetching}
            >
              <RefreshCw
                className={cn("size-3.5", deliveries.isFetching && "animate-spin")}
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
              onChange={(e) => updateFilter("templateKey", e.target.value)}
              className="max-w-[180px]"
            />
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={filters.status}
              onChange={(e) => updateFilter("status", e.target.value)}
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
              {deliveries.isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-16 text-center">
                    <Spinner className="mx-auto size-5" />
                  </TableCell>
                </TableRow>
              ) : (deliveries.data?.data ?? []).length === 0 ? (
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
                (deliveries.data?.data ?? []).map((delivery) => {
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
                          onClick={() => setSelectedDelivery(delivery)}
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
            page={filters.page}
            pageSize={DELIVERY_PAGE_SIZE}
            totalPages={totalPages}
            total={total}
            isLoading={deliveries.isFetching}
            onPageChange={(p) => updateFilter("page", p)}
          />
        </CardContent>
      </Card>

      {/* Delivery detail drawer */}
      <ResourceDrawer
        open={!!selectedDelivery}
        title="Delivery detail"
        description={
          selectedDelivery
            ? `Template: ${selectedDelivery.templateKey}`
            : ""
        }
        onClose={() => setSelectedDelivery(null)}
      >
        {selectedDelivery && (
          <div className="space-y-4 text-sm">
            <div>
              <Label className="text-xs text-muted-foreground">ID</Label>
              <p className="mt-0.5 font-mono text-xs">
                {selectedDelivery.id}
              </p>
            </div>
            <Separator />
            <div>
              <Label className="text-xs text-muted-foreground">
                Template key
              </Label>
              <p className="mt-0.5 font-mono text-xs">
                {selectedDelivery.templateKey}
              </p>
            </div>
            <Separator />
            <div>
              <Label className="text-xs text-muted-foreground">
                Recipient
              </Label>
              <p className="mt-0.5">{selectedDelivery.recipient}</p>
            </div>
            <Separator />
            <div>
              <Label className="text-xs text-muted-foreground">Subject</Label>
              <p className="mt-0.5">{selectedDelivery.subject}</p>
            </div>
            <Separator />
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <div className="mt-0.5">
                <Badge
                  variant={mailStatusProps(String(selectedDelivery.status)).variant}
                  className={cn(
                    "text-xs capitalize",
                    mailStatusProps(String(selectedDelivery.status)).className,
                  )}
                >
                  {String(selectedDelivery.status).toLowerCase()}
                </Badge>
              </div>
            </div>
            {selectedDelivery.errorMessage && (
              <>
                <Separator />
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Error
                  </Label>
                  <p className="mt-0.5 text-destructive">
                    {scalarString(selectedDelivery.errorMessage)}
                  </p>
                </div>
              </>
            )}
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Created at
                </Label>
                <p className="mt-0.5">
                  {formatDateTime(selectedDelivery.createdAt)}
                </p>
              </div>
              {selectedDelivery.sentAt && (
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Sent at
                  </Label>
                  <p className="mt-0.5">
                    {formatUnknownDateTime(selectedDelivery.sentAt)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </ResourceDrawer>
    </ResourcePageShell>
  );
}
