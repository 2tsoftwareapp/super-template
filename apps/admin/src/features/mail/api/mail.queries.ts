"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchMailDeliveries,
  fetchMailPreview,
  fetchMailTemplates,
  type MailDeliveriesParams,
} from "./mail.api";
import { mailKeys } from "./mail.query-keys";

export function useMailTemplatesQuery() {
  return useQuery({
    queryKey: mailKeys.templates,
    queryFn: fetchMailTemplates,
  });
}

export function useMailDeliveriesQuery(params: MailDeliveriesParams) {
  return useQuery({
    queryKey: mailKeys.deliveries({ templateKey: params.templateKey, status: params.status, page: params.page }),
    queryFn: () => fetchMailDeliveries(params),
    placeholderData: (previous) => previous,
  });
}

export function useMailPreviewQuery(templateKey: string) {
  return useQuery({
    queryKey: mailKeys.preview(templateKey),
    queryFn: () => fetchMailPreview(templateKey),
    enabled: Boolean(templateKey),
  });
}
