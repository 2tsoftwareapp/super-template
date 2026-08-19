import { bffPath } from "@repo/api-contract";

import type { MailDeliveriesParams, SendMailInput } from "@/features/mail/model/mail.types";
import type {
  ListResponse,
  MailDeliveryDto,
  MailPreviewDto,
  MailTemplateDto,
  SendAdminMailResultDto,
} from "@/lib/api-types";

import { buildPath, webFetch } from "@/lib/http";

export type { MailDeliveriesParams, SendMailInput };

/**
 * Mail transport layer. Paths from OpenAPI via `bffPath` (§22).
 */
export const mailApi = {
  templates() {
    return webFetch<{ data: MailTemplateDto[] }>(bffPath("/api/v1/admin/mail/templates"));
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
    return webFetch<{ data: SendAdminMailResultDto }>(bffPath("/api/v1/admin/mail/send"), {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};
