"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/web-ui/card";
import { Pagination } from "@repo/web-ui/pagination";
import { Show } from "@repo/web-ui/show";

import type { MailViewModel } from "@/features/mail/model/mail.types";
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used in row.original cast
import type { MailDeliveryDto } from "@/lib/api-types";

import { ResourcePageShell } from "@/components/resource-page-shell";
import { ResourceTable } from "@/components/resource-table";
import { ResourceToolbar } from "@/components/resource-toolbar";

import { MailDetailDrawer } from "./mail-detail-drawer";
import { MailSendForm } from "./mail-send-form";
import { MailTemplateCard } from "./mail-template-card";
import { MailTemplateCatalog } from "./mail-template-catalog";

export function MailListView({
  header,
  preview,
  templateCatalog,
  sendForm,
  deliveries,
  detail,
  table,
}: MailViewModel) {
  return (
    <ResourcePageShell
      resource={header.resource}
      description={header.description}
      isRefreshing={header.isRefreshing}
      onRefresh={header.onRefresh}
    >
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <MailTemplateCard preview={preview} />
        <MailTemplateCatalog catalog={templateCatalog} />
      </div>

      <Show when={sendForm.canAccess}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Send test mail</CardTitle>
            <CardDescription className="text-xs">
              Send an ad-hoc email using a sendable template.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MailSendForm
              templates={sendForm.sendableTemplates}
              isPending={sendForm.isPending}
              onSubmit={sendForm.onSend}
            />
          </CardContent>
        </Card>
      </Show>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Deliveries</CardTitle>
              <CardDescription className="text-xs">
                {deliveries.total > 0
                  ? `${deliveries.total} deliver${deliveries.total !== 1 ? "ies" : "y"}`
                  : "History from the mail delivery endpoint."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <ResourceToolbar
          search={deliveries.filters.templateKey}
          onSearchChange={(value) => deliveries.onFilterChange("templateKey", value)}
          searchPlaceholder="Template key"
          hasFilters={Boolean(deliveries.filters.templateKey || deliveries.filters.status)}
          onClearFilters={() => {
            deliveries.onFilterChange("templateKey", "");
            deliveries.onFilterChange("status", "");
          }}
          filters={
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={deliveries.filters.status}
              onChange={(e) => deliveries.onFilterChange("status", e.target.value)}
            >
              {deliveries.statusOptions.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          }
        />
        <CardContent className="p-0 pb-1">
          <ResourceTable
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- model table is any
            table={table}
            isLoading={deliveries.isLoading}
            {...(deliveries.isError ? { error: { title: "Could not load deliveries." } } : {})}
            onRetry={deliveries.onRetry}
            emptyTitle={
              deliveries.filters.templateKey || deliveries.filters.status
                ? "No deliveries match your filters."
                : "No deliveries recorded."
            }
          />
          <Pagination
            page={deliveries.page}
            pageSize={deliveries.pageSize}
            totalPages={deliveries.totalPages}
            total={deliveries.total}
            isLoading={deliveries.isFetching}
            onPageChange={deliveries.onPageChange}
          />
        </CardContent>
      </Card>

      <MailDetailDrawer selectedDelivery={detail.selectedDelivery} onClose={detail.onClose} />
    </ResourcePageShell>
  );
}
