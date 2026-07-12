"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/web-core/components/card";
import { Input } from "@repo/web-core/components/input";
import { Label } from "@repo/web-core/components/label";
import { LoadingButton } from "@repo/web-core/components/loading-button";

import { ResourcePageShell } from "@/components/resource-page-shell";

import type { MailViewModel } from "../controllers/use-mail-controller";

import { MailDeliveriesTable } from "./mail-deliveries-table";
import { MailDetailDrawer } from "./mail-detail-drawer";
import { MailTemplateCard } from "./mail-template-card";
import { MailTemplateCatalog } from "./mail-template-catalog";

export function MailListView({
  header,
  preview,
  templateCatalog,
  sendForm,
  deliveries,
  detail,
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
        <MailTemplateCatalog
          isLoading={templateCatalog.isLoading}
          items={templateCatalog.items}
          onSelect={templateCatalog.onSelect}
        />
      </div>

      {/* Send test mail */}
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
                value={sendForm.selectedTemplateKey}
                onChange={(e) => sendForm.onChangeTemplate(e.target.value)}
              >
                <option value="">Select a template</option>
                {sendForm.sendableTemplates.map((tmpl) => (
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
                value={sendForm.recipient}
                onChange={(e) => sendForm.onChangeRecipient(e.target.value)}
              />
            </div>
            {sendForm.selectedTemplate?.variables &&
              sendForm.selectedTemplate.variables.length > 0 && (
                <div className="space-y-3 sm:col-span-2">
                  <Label className="text-xs text-muted-foreground">
                    Variables
                  </Label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {sendForm.selectedTemplate.variables.map((varName) => (
                      <div key={varName} className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground font-mono">
                          {varName}
                        </Label>
                        <Input
                          placeholder={`Value for ${varName}`}
                          value={sendForm.variableValues[varName] ?? ""}
                          onChange={(e) =>
                            sendForm.onVariableChange(
                              varName,
                              e.target.value,
                            )
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
                value={sendForm.idempotencyKey}
                onChange={(e) =>
                  sendForm.onChangeIdempotencyKey(e.target.value)
                }
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <LoadingButton
              size="sm"
              onClick={sendForm.onSend}
              disabled={!sendForm.canSend}
              loading={sendForm.isPending}
            >
              Send mail
            </LoadingButton>
          </div>
        </CardContent>
      </Card>

      <MailDeliveriesTable
        items={deliveries.items}
        total={deliveries.total}
        totalPages={deliveries.totalPages}
        page={deliveries.page}
        pageSize={deliveries.pageSize}
        isFetching={deliveries.isFetching}
        isLoading={deliveries.isLoading}
        filters={deliveries.filters}
        onFilterChange={deliveries.onFilterChange}
        onPageChange={deliveries.onPageChange}
        onRefresh={deliveries.onRefresh}
        onSelectDelivery={detail.onSelect}
      />

      <MailDetailDrawer
        selectedDelivery={detail.selectedDelivery}
        onClose={detail.onClose}
      />
    </ResourcePageShell>
  );
}
