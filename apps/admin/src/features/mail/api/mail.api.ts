import { bffPath } from "@repo/api-contract";

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

export interface SendMailInput {
  templateKey: string;
  to: string;
  variables: Record<string, string>;
  idempotencyKey?: string;
}

export const mailApi = {
  templates() {
    return webFetch<{ data: MailTemplateDto[] }>(
      bffPath("/api/v1/admin/mail/templates"),
    );
  },

  deliveries(params: MailDeliveriesParams) {
    const path = buildPath(bffPath("/api/v1/admin/mail/deliveries"), {
      limit: params.limit,
      page: params.page,
      templateKey: params.templateKey,
      status: params.status,
    });
    return webFetch<ListResponse<MailDeliveryDto>>(path);
  },

  preview(templateKey: string) {
    return webFetch<{ data: MailPreviewDto }>(
      bffPath("/api/v1/admin/mail/preview/{templateKey}", { templateKey }),
    );
  },

  send(input: SendMailInput) {
    return webFetch<{ data: SendAdminMailResultDto }>(
      bffPath("/api/v1/admin/mail/send"),
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );
  },
};

/** @deprecated Prefer `mailApi` */
export const fetchMailTemplates = () => mailApi.templates();
export const fetchMailDeliveries = (params: MailDeliveriesParams) =>
  mailApi.deliveries(params);
export const fetchMailPreview = (templateKey: string) =>
  mailApi.preview(templateKey);
export const sendMail = (input: SendMailInput) => mailApi.send(input);
