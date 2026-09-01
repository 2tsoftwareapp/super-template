"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/web-ui/card";
import { CommonResourcePage } from "@repo/web-ui/common-resource-page";
import { ResourceDataTable } from "@repo/web-ui/resource-data-table";
import { ResourceFilterBar } from "@repo/web-ui/resource-filter-bar";
import { Show } from "@repo/web-ui/show";

import type { MailViewModel } from "@/features/mail/model/mail.types";

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
    <CommonResourcePage
      resource={header.resource}
      description={header.description}
      isRefreshing={header.isRefreshing}
      onRefresh={header.onRefresh}
      statsSlot={
        <div className="flex flex-col gap-6">
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
        </div>
      }
      filterBar={
        <ResourceFilterBar
          search={{
            value: deliveries.filters.templateKey,
            onChange: (value) => deliveries.onFilterChange("templateKey", value),
            placeholder: "Template key",
          }}
          facets={[
            {
              key: "status",
              label: "Status",
              options: deliveries.statusOptions
                .filter((opt) => opt.value !== "")
                .map((opt) => ({
                  label: opt.label,
                  value: opt.value,
                })),
              selectedValues: deliveries.filters.status ? [deliveries.filters.status] : [],
              onChange: (values) => {
                deliveries.onFilterChange("status", values[values.length - 1] ?? "");
              },
            },
          ]}
          onClearAll={() => {
            deliveries.onFilterChange("templateKey", "");
            deliveries.onFilterChange("status", "");
          }}
        />
      }
      pagination={{
        page: deliveries.page,
        pageSize: deliveries.pageSize,
        total: deliveries.total,
        totalPages: deliveries.totalPages,
        isLoading: deliveries.isFetching,
        onPageChange: deliveries.onPageChange,
      }}
      detailPane={
        <MailDetailDrawer selectedDelivery={detail.selectedDelivery} onClose={detail.onClose} />
      }
    >
      <ResourceDataTable
        table={table}
        isLoading={deliveries.isLoading}
        error={
          deliveries.isError
            ? { title: "Could not load deliveries.", onRetry: deliveries.onRetry }
            : undefined
        }
        onRowClick={(row) => detail.onSelect(row)}
        empty={{
          title:
            deliveries.filters.templateKey || deliveries.filters.status
              ? "No deliveries match your filters."
              : "No deliveries recorded.",
        }}
      />
    </CommonResourcePage>
  );
}
