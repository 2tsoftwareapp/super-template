"use client";

import { useDebouncedValue } from "@repo/web-hooks/use-debounced-value";
import { getErrorMessage } from "@repo/web-utils/errors";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import type { MailViewModel } from "@/features/mail/model/mail.types";

import {
  useMailDeliveriesQuery,
  useMailPreviewQuery,
  useMailTemplatesQuery,
} from "@/features/mail/api/mail.queries";
import { mailKeys } from "@/features/mail/api/mail.query-keys";
import { DELIVERY_STATUS_OPTIONS, mailStatusProps } from "@/features/mail/model/mail.constants";
import { selectMailPermissions } from "@/features/mail/model/mail.permissions";
import { DELIVERY_PAGE_SIZE } from "@/features/mail/model/mail.search-params";
import { useSession } from "@/hooks/use-session";
import { usePathname, useRouter } from "@/i18n/navigation";
import { adminResources } from "@/lib/admin-resources";

import { useMailFilters } from "./use-mail-filters";
import { useMailSendForm } from "./use-mail-send-form";

const mailResource = adminResources.find((r) => r.id === "mail")!;

export type { MailViewModel };

/**
 * Orchestration hook for the admin mail console.
 *
 * Flow:
 *   1. Parse URL filters; debounce templateKey before list query.
 *   2. Load templates + deliveries in parallel; preview by selected key.
 *   3. Send form gated by `mail.create`; mutations toast + invalidate lists.
 *   4. Detail drawer selects a delivery row (no extra fetch).
 * Owns: URL filters, templates/deliveries/preview queries, send form gate.
 * Does not own: template card / deliveries table markup.
 */
export function useMailController(): MailViewModel {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const session = useSession();
  const permissions = selectMailPermissions(session.data?.data.permissions);

  const { filters, updateFilter } = useMailFilters(searchParams, pathname, router);
  const debouncedTemplateKey = useDebouncedValue(filters.templateKey, 400);

  const [templateKey, setTemplateKey] = useState("auth.welcome");
  const [selectedDelivery, setSelectedDelivery] =
    useState<MailViewModel["detail"]["selectedDelivery"]>(null);

  const templates = useMailTemplatesQuery();

  const deliveries = useMailDeliveriesQuery({
    templateKey: debouncedTemplateKey || undefined,
    status: filters.status || undefined,
    page: filters.page,
    limit: DELIVERY_PAGE_SIZE,
  });

  const total = deliveries.data?.meta?.total ?? 0;
  const totalPages = deliveries.data?.meta?.totalPages ?? 1;

  const preview = useMailPreviewQuery(templateKey);
  const sendForm = useMailSendForm(templates.data?.data, permissions.canSend);

  const retryTemplates = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: mailKeys.templates() });
  }, [queryClient]);

  const retryDeliveries = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: mailKeys.lists() });
  }, [queryClient]);

  const handleRefresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: mailKeys.all });
  }, [queryClient]);

  return {
    header: {
      resource: mailResource,
      description: "Review delivery history, browse templates, and send test emails.",
      isRefreshing: templates.isFetching || deliveries.isFetching,
      onRefresh: handleRefresh,
    },
    preview: {
      templateKey,
      onChange: setTemplateKey,
      onPreview: () => void preview.refetch(),
      isFetching: preview.isFetching,
      isLoading: preview.isLoading,
      isError: preview.isError,
      errorMessage: getErrorMessage(
        preview.error,
        "The template key is invalid or the preview endpoint is unavailable.",
      ),
      data: preview.data?.data,
    },
    templateCatalog: {
      isLoading: templates.isLoading,
      isError: templates.isError,
      onRetry: retryTemplates,
      items: templates.data?.data ?? [],
      onSelect: setTemplateKey,
    },
    sendForm: {
      canAccess: sendForm.canAccess,
      selectedTemplateKey: sendForm.selectedTemplateKey,
      recipient: sendForm.recipient,
      variableValues: sendForm.variableValues,
      idempotencyKey: sendForm.idempotencyKey,
      sendableTemplates: sendForm.sendableTemplates,
      selectedTemplate: sendForm.selectedTemplate,
      onChangeTemplate: sendForm.onChangeTemplate,
      onChangeRecipient: sendForm.onChangeRecipient,
      onVariableChange: sendForm.onVariableChange,
      onChangeIdempotencyKey: sendForm.onChangeIdempotencyKey,
      onSend: sendForm.onSend,
      isPending: sendForm.isPending,
      canSend: sendForm.canSend,
    },
    deliveries: {
      items: deliveries.data?.data ?? [],
      total,
      totalPages,
      page: filters.page,
      pageSize: DELIVERY_PAGE_SIZE,
      isFetching: deliveries.isFetching,
      isLoading: deliveries.isLoading,
      isError: deliveries.isError,
      onRetry: retryDeliveries,
      filters: {
        templateKey: filters.templateKey,
        status: filters.status,
      },
      statusOptions: DELIVERY_STATUS_OPTIONS,
      statusProps: mailStatusProps,
      onFilterChange: updateFilter,
      onPageChange: (p) => updateFilter("page", p),
      onRefresh: retryDeliveries,
    },
    detail: {
      selectedDelivery,
      onSelect: setSelectedDelivery,
      onClose: () => setSelectedDelivery(null),
    },
  };
}
