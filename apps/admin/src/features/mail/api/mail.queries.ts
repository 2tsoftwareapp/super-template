"use client";

import { useQuery } from "@tanstack/react-query";

import type { MailDeliveriesParams } from "@/features/mail/model/mail.types";

import { mailApi } from "./mail.api";
import { mailKeys } from "./mail.query-keys";

export function useMailTemplatesQuery() {
  return useQuery({
    queryKey: mailKeys.templates(),
    queryFn: () => mailApi.templates(),
  });
}

export function useMailDeliveriesQuery(params: MailDeliveriesParams) {
  return useQuery({
    queryKey: mailKeys.list({
      templateKey: params.templateKey,
      status: params.status,
      page: params.page,
      limit: params.limit,
      sortOrder: params.sortOrder,
    }),
    queryFn: () => mailApi.deliveries(params),
    placeholderData: (previous) => previous,
    staleTime: 0,
  });
}

export function useMailPreviewQuery(templateKey: string) {
  return useQuery({
    queryKey: mailKeys.preview(templateKey),
    queryFn: () => mailApi.preview(templateKey),
    enabled: Boolean(templateKey),
  });
}
