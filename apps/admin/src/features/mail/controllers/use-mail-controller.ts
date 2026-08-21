"use client";

import type { SortCriterion } from "@repo/api-sort";

import { useDebouncedValue } from "@repo/web-hooks/use-debounced-value";
import { getErrorMessage } from "@repo/web-utils/errors";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import type { MailDeliveriesColumnFactory, MailViewModel } from "@/features/mail/model/mail.types";
import type { MailDeliveryDto } from "@/lib/api-types";

import { useResourceTableConfig } from "@/components/use-resource-table-config";
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
import { createTableSortBridge } from "@/lib/table-sort";

import { useMailFilters } from "./use-mail-filters";
import { useMailSendForm } from "./use-mail-send-form";

const mailResource = adminResources.find((r) => r.id === "mail")!;

export type { MailViewModel };

type MailSortField = "createdAt";

const mailSortBridge = createTableSortBridge<MailSortField>({
  fieldByColumn: {
    createdAt: "createdAt",
  },
  columnByField: {
    createdAt: "createdAt",
  },
});

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
interface UseMailControllerOptions {
  /** Column factory from ui/mail-deliveries-columns, injected by the screen. */
  createColumns: MailDeliveriesColumnFactory;
}

export function useMailController({ createColumns }: UseMailControllerOptions): MailViewModel {
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
    sortOrder: filters.sortOrder,
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

  const handleSortChange = (nextSort: SortCriterion<MailSortField>[]) => {
    const primary = nextSort[0] ?? { field: "createdAt" as const, order: "desc" as const };
    updateFilter("sortOrder", primary.order);
  };

  const deliveriesSort: SortCriterion<MailSortField>[] = [
    { field: "createdAt", order: filters.sortOrder },
  ];

  const deliveriesItems = deliveries.data?.data ?? [];

  const { table, handlePageChange } = useResourceTableConfig<MailDeliveryDto, MailSortField>({
    data: deliveriesItems,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- model now any[]
    columns: createColumns({ onSelectDelivery: setSelectedDelivery }),
    enableSelection: false,
    getRowId: (row) => row.id,
    listParams: { sort: deliveriesSort },
    sortBridge: mailSortBridge,
    onSortChange: handleSortChange,
    onPageChange: (p) => updateFilter("page", p),
  });

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
      sendableTemplates: sendForm.sendableTemplates,
      isPending: sendForm.isPending,
      onSend: sendForm.onSend,
    },
    deliveries: {
      items: deliveriesItems,
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
      onPageChange: handlePageChange,
    },
    detail: {
      selectedDelivery,
      onSelect: setSelectedDelivery,
      onClose: () => setSelectedDelivery(null),
    },
    table,
  };
}
