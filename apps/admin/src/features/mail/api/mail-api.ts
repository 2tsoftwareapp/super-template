import type {
  ListResponse,
  MailDeliveryDto,
  MailPreviewDto,
  MailTemplateDto,
  SendAdminMailResultDto,
} from "@/lib/api-types";

import { buildPath, webFetch } from "@/lib/http";

export interface MailDeliveriesParams {
  templateKey?: string | undefined;
  status?: string | undefined;
  page: number;
  limit: number;
}

export async function fetchMailTemplates() {
  return webFetch<{ data: MailTemplateDto[] }>(
    "/api/bff/admin/mail/templates",
  );
}

export async function fetchMailDeliveries(params: MailDeliveriesParams) {
  const path = buildPath("/api/bff/admin/mail/deliveries", {
    limit: params.limit,
    page: params.page,
    templateKey: params.templateKey,
    status: params.status,
  });
  return webFetch<ListResponse<MailDeliveryDto>>(path);
}

export async function fetchMailPreview(templateKey: string) {
  return webFetch<{ data: MailPreviewDto }>(
    `/api/bff/admin/mail/preview/${encodeURIComponent(templateKey)}`,
  );
}

export interface SendMailInput {
  templateKey: string;
  to: string;
  variables: Record<string, string>;
  idempotencyKey?: string;
}

export async function sendMail(input: SendMailInput) {
  return webFetch<{ data: SendAdminMailResultDto }>(
    "/api/bff/admin/mail/send",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}
