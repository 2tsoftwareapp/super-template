import type { ColumnDef } from "@tanstack/react-table";
import type { Table as ReactTable } from "@tanstack/react-table";

import type { AdminResourceConfig } from "@/lib/admin-resources";
import type { MailDeliveryDto, MailPreviewDto, MailTemplateDto } from "@/lib/api-types";

import type { DELIVERY_STATUS_OPTIONS } from "./mail.constants";
import type { SendMailFormValues } from "./mail.schemas";
import type { MailFilters } from "./mail.search-params";

export interface MailDeliveriesParams {
  templateKey?: string | undefined;
  status?: string | undefined;
  page: number;
  limit: number;
  sortOrder?: "asc" | "desc" | undefined;
}

export interface MailDeliveriesColumnOptions {
  onSelectDelivery: (delivery: MailDeliveryDto) => void;
}

export type MailDeliveriesColumnFactory = (
  options: MailDeliveriesColumnOptions,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mirrors TanStack's own `columns: ColumnDef<TData, any>[]` input type
) => ColumnDef<MailDeliveryDto, any>[];

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
    sendableTemplates: MailTemplateDto[];
    isPending: boolean;
    onSend: (values: SendMailFormValues) => void;
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
  };
  detail: {
    selectedDelivery: MailDeliveryDto | null;
    onSelect: (delivery: MailDeliveryDto | null) => void;
    onClose: () => void;
  };
  table: ReactTable<MailDeliveryDto>;
}
