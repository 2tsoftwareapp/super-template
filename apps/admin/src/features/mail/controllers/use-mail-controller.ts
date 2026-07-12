"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import type {
  MailDeliveryDto,
  MailPreviewDto,
  MailTemplateDto,
} from "@/lib/api-types";

import { useSendMailMutation } from "@/features/mail/use-mail-mutations";
import {
  useMailDeliveriesQuery,
  useMailPreviewQuery,
  useMailTemplatesQuery,
} from "@/features/mail/use-mail-queries";
import { usePathname, useRouter } from "@/i18n/navigation";
import { adminResources } from "@/lib/admin-resources";

import type { Filters } from "../model/mail-schemas";

import { DELIVERY_PAGE_SIZE, parseFilters } from "../model/mail-schemas";

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
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [filters, setFilters] = useState<Filters>(() =>
    parseFilters(new URLSearchParams(searchParams.toString())),
  );

  const updateFilter = useCallback(
    (key: keyof Filters, value: string | number) => {
      setFilters((prev) => {
        const next = { ...prev, [key]: value };
        if (key !== "page") next.page = 1;
        const sp = new URLSearchParams();
        if (next.status) sp.set("status", next.status);
        if (next.templateKey) sp.set("templateKey", next.templateKey);
        if (next.page > 1) sp.set("page", String(next.page));
        const qs = sp.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
        return next;
      });
    },
    [pathname, router],
  );

  const [templateKey, setTemplateKey] = useState("auth.welcome");
  const [selectedDelivery, setSelectedDelivery] =
    useState<MailDeliveryDto | null>(null);

  // Send form state
  const [sendTemplateKey, setSendTemplateKey] = useState("");
  const [sendRecipient, setSendRecipient] = useState("");
  const [variableValues, setVariableValues] = useState<
    Record<string, string>
  >({});
  const [sendIdempotencyKey, setSendIdempotencyKey] = useState("");

  const templates = useMailTemplatesQuery();

  const selectedTemplate = useMemo(
    () =>
      sendTemplateKey
        ? (templates.data?.data ?? []).find((t) => t.key === sendTemplateKey)
        : undefined,
    [sendTemplateKey, templates.data?.data],
  );

  const handleTemplateChange = useCallback(
    (key: string) => {
      setSendTemplateKey(key);
      const tmpl = (templates.data?.data ?? []).find((t) => t.key === key);
      setVariableValues(
        Object.fromEntries((tmpl?.variables ?? []).map((v) => [v, ""])),
      );
    },
    [templates.data?.data],
  );

  const deliveries = useMailDeliveriesQuery({
    templateKey: filters.templateKey || undefined,
    status: filters.status || undefined,
    page: filters.page,
    limit: DELIVERY_PAGE_SIZE,
  });

  const total = deliveries.data?.meta?.total ?? 0;
  const totalPages = deliveries.data?.meta?.totalPages ?? 1;

  const preview = useMailPreviewQuery(templateKey);

  const resetForm = useCallback(() => {
    setSendTemplateKey("");
    setSendRecipient("");
    setVariableValues({});
    setSendIdempotencyKey("");
  }, []);

  const sendMail = useSendMailMutation({
    onSuccess: resetForm,
  });

  const handleRefresh = useCallback(() => {
    void templates.refetch();
    void deliveries.refetch();
  }, [templates, deliveries]);

  const handleSend = useCallback(() => {
    sendMail.mutate({
      templateKey: sendTemplateKey,
      to: sendRecipient,
      variables: variableValues,
      ...(sendIdempotencyKey
        ? { idempotencyKey: sendIdempotencyKey }
        : {}),
    });
  }, [sendMail, sendTemplateKey, sendRecipient, variableValues, sendIdempotencyKey]);

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
      selectedTemplateKey: sendTemplateKey,
      recipient: sendRecipient,
      variableValues,
      idempotencyKey: sendIdempotencyKey,
      sendableTemplates: (templates.data?.data ?? []).filter(
        (t) => t.sendable,
      ),
      selectedTemplate,
      onChangeTemplate: handleTemplateChange,
      onChangeRecipient: setSendRecipient,
      onVariableChange: (name, value) => {
        setVariableValues((prev) => ({ ...prev, [name]: value }));
      },
      onChangeIdempotencyKey: setSendIdempotencyKey,
      onSend: handleSend,
      isPending: sendMail.isPending,
      canSend: Boolean(sendTemplateKey && sendRecipient),
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
