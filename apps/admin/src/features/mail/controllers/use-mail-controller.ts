"use client";

import { useCallback, useState } from "react";

import type {
  MailDeliveryDto,
  MailPreviewDto,
  MailTemplateDto,
} from "@/lib/api-types";

import {
  useMailDeliveriesQuery,
  useMailPreviewQuery,
  useMailTemplatesQuery,
} from "@/features/mail/use-mail-queries";
import { adminResources } from "@/lib/admin-resources";

import type { Filters } from "../model/mail-schemas";

import { DELIVERY_PAGE_SIZE } from "../model/mail-schemas";
import { useMailFilters } from "./use-mail-filters";
import { useMailSendForm } from "./use-mail-send-form";

const mailResource = adminResources.find((r) => r.id === "mail")!;

export interface MailViewModel {
  header: {
    resource: typeof mailResource;
    description: string;
    isRefreshing: boolean;
    onRefresh: () => void;
  };
  preview: {
    templateKey: string;
    onChange: (key: string) => void;
    onPreview: () => void;
    isFetching: boolean;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    data: MailPreviewDto | undefined;
  };
  templateCatalog: {
    isLoading: boolean;
    items: MailTemplateDto[];
    onSelect: (key: string) => void;
  };
  sendForm: {
    selectedTemplateKey: string;
    recipient: string;
    variableValues: Record<string, string>;
    idempotencyKey: string;
    sendableTemplates: MailTemplateDto[];
    selectedTemplate: MailTemplateDto | undefined;
    onChangeTemplate: (key: string) => void;
    onChangeRecipient: (email: string) => void;
    onVariableChange: (name: string, value: string) => void;
    onChangeIdempotencyKey: (key: string) => void;
    onSend: () => void;
    isPending: boolean;
    canSend: boolean;
  };
  deliveries: {
    items: MailDeliveryDto[];
    total: number;
    totalPages: number;
    page: number;
    pageSize: number;
    isFetching: boolean;
    isLoading: boolean;
    filters: {
      templateKey: string;
      status: string;
    };
    onFilterChange: (key: keyof Filters, value: string | number) => void;
    onPageChange: (page: number) => void;
    onRefresh: () => void;
  };
  detail: {
    selectedDelivery: MailDeliveryDto | null;
    onSelect: (delivery: MailDeliveryDto | null) => void;
    onClose: () => void;
  };
}

export function useMailController(): MailViewModel {
  const { filters, updateFilter } = useMailFilters();

  const [templateKey, setTemplateKey] = useState("auth.welcome");
  const [selectedDelivery, setSelectedDelivery] =
    useState<MailDeliveryDto | null>(null);

  const templates = useMailTemplatesQuery();

  const deliveries = useMailDeliveriesQuery({
    templateKey: filters.templateKey || undefined,
    status: filters.status || undefined,
    page: filters.page,
    limit: DELIVERY_PAGE_SIZE,
  });

  const total = deliveries.data?.meta?.total ?? 0;
  const totalPages = deliveries.data?.meta?.totalPages ?? 1;

  const preview = useMailPreviewQuery(templateKey);

  const sendForm = useMailSendForm(templates.data?.data);

  const handleRefresh = useCallback(() => {
    void templates.refetch();
    void deliveries.refetch();
  }, [templates, deliveries]);

  return {
    header: {
      resource: mailResource,
      description:
        "Review delivery history, browse templates, and send test emails.",
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
      error: preview.error,
      data: preview.data?.data,
    },
    templateCatalog: {
      isLoading: templates.isLoading,
      items: templates.data?.data ?? [],
      onSelect: setTemplateKey,
    },
    sendForm: {
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
      filters: {
        templateKey: filters.templateKey,
        status: filters.status,
      },
      onFilterChange: updateFilter,
      onPageChange: (p) => updateFilter("page", p),
      onRefresh: () => void deliveries.refetch(),
    },
    detail: {
      selectedDelivery,
      onSelect: setSelectedDelivery,
      onClose: () => setSelectedDelivery(null),
    },
  };
}
