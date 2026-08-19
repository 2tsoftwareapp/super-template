import type { AdminResourceConfig } from "@/lib/admin-resources";
import type { MailDeliveryDto, MailPreviewDto, MailTemplateDto } from "@/lib/api-types";

import type { DELIVERY_STATUS_OPTIONS } from "./mail.constants";
import type { MailFilters } from "./mail.search-params";

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

export interface MailViewModel {
  header: {
    resource: AdminResourceConfig;
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
    errorMessage: string;
    data: MailPreviewDto | undefined;
  };
  templateCatalog: {
    isLoading: boolean;
    isError: boolean;
    onRetry: () => void;
    items: MailTemplateDto[];
    onSelect: (key: string) => void;
  };
  sendForm: {
    canAccess: boolean;
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
    isError: boolean;
    onRetry: () => void;
    filters: {
      templateKey: string;
      status: string;
    };
    statusOptions: typeof DELIVERY_STATUS_OPTIONS;
    statusProps: (status: string) => {
      variant: "default" | "secondary" | "outline";
      className?: string;
    };
    onFilterChange: (key: keyof MailFilters, value: string | number) => void;
    onPageChange: (page: number) => void;
    onRefresh: () => void;
  };
  detail: {
    selectedDelivery: MailDeliveryDto | null;
    onSelect: (delivery: MailDeliveryDto | null) => void;
    onClose: () => void;
  };
}
