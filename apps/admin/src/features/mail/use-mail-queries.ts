"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchMailDeliveries,
  fetchMailPreview,
  fetchMailTemplates,
  type MailDeliveriesParams,
} from "./api/mail-api";
import { MAIL_DELIVERIES_QUERY_KEY, MAIL_PREVIEW_QUERY_KEY, MAIL_TEMPLATES_QUERY_KEY } from "./mail-query-keys";

export function useMailTemplatesQuery() {
  return useQuery({
    queryKey: [MAIL_TEMPLATES_QUERY_KEY],
    queryFn: fetchMailTemplates,
  });
}

export function useMailDeliveriesQuery(params: MailDeliveriesParams) {
  return useQuery({
    queryKey: [
      MAIL_DELIVERIES_QUERY_KEY,
      params.templateKey,
      params.status,
      params.page,
    ],
    queryFn: () => fetchMailDeliveries(params),
  });
}

export function useMailPreviewQuery(templateKey: string) {
  return useQuery({
    queryKey: [MAIL_PREVIEW_QUERY_KEY, templateKey],
    queryFn: () => fetchMailPreview(templateKey),
    enabled: Boolean(templateKey),
  });
}
