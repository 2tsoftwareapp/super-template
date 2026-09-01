import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { MailViewModel } from "@/features/mail/model/mail.types";
import type { MailDeliveryDto } from "@/lib/api-types";

import { adminResources } from "@/features/_plugin-resources/admin-resources";
import { DELIVERY_STATUS_OPTIONS } from "@/features/mail/model/mail.constants";

import { MailListView } from "../mail-list-view";

const mailResource = adminResources.find((r) => r.id === "mail")!;

const mockDelivery = {
  id: "del-101",
  templateKey: "welcome_email",
  recipient: "user@example.com",
  subject: "Welcome!",
  status: "SENT",
  errorMessage: null,
  createdAt: "2026-03-01T12:00:00Z",
  sentAt: "2026-03-01T12:00:05Z",
} as unknown as MailDeliveryDto;

const mockTemplate = {
  key: "welcome_email",
  variables: ["userName"],
  mandatory: false,
  sendable: true,
};

function TestHarness(props: Partial<MailViewModel>) {
  // eslint-disable-next-line react-hooks/incompatible-library -- React Table standard hook
  const table = useReactTable({
    data: [mockDelivery],
    columns: [
      { accessorKey: "id", header: "ID" },
      { accessorKey: "recipient", header: "Recipient" },
    ],
    getCoreRowModel: getCoreRowModel(),
  });

  const defaultProps: MailViewModel = {
    header: {
      resource: mailResource,
      description: "Send test emails and inspect delivery history.",
      isRefreshing: false,
      onRefresh: vi.fn(),
    },
    preview: {
      templateKey: "",
      onChange: vi.fn(),
      onPreview: vi.fn(),
      isFetching: false,
      isLoading: false,
      isError: false,
      errorMessage: "",
      data: undefined,
    },
    templateCatalog: {
      isLoading: false,
      isError: false,
      items: [mockTemplate],
      onRetry: vi.fn(),
      onSelect: vi.fn(),
    },
    sendForm: {
      canAccess: true,
      sendableTemplates: [mockTemplate],
      isPending: false,
      onSend: vi.fn(),
    },
    deliveries: {
      items: [mockDelivery],
      total: 1,
      totalPages: 1,
      page: 1,
      pageSize: 20,
      isFetching: false,
      isLoading: false,
      isError: false,
      onRetry: vi.fn(),
      filters: {
        templateKey: "",
        status: "",
      },
      statusOptions: DELIVERY_STATUS_OPTIONS,
      statusProps: () => ({ variant: "outline" as const }),
      onFilterChange: vi.fn(),
      onPageChange: vi.fn(),
    },
    detail: {
      selectedDelivery: null,
      onSelect: vi.fn(),
      onClose: vi.fn(),
    },
    table,
    ...props,
  };

  return <MailListView {...defaultProps} />;
}

describe("MailListView", () => {
  it("renders the resource header, template catalog, and filter bar", () => {
    render(<TestHarness />);
    expect(screen.getByText("Mail")).toBeInTheDocument();
    expect(screen.getByText("Template catalog")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Template key")).toBeInTheDocument();
  });

  it("renders detail pane when selectedDelivery is provided", () => {
    render(
      <TestHarness
        detail={{
          selectedDelivery: mockDelivery,
          onSelect: vi.fn(),
          onClose: vi.fn(),
        }}
      />,
    );
    expect(screen.getByText("Delivery detail")).toBeInTheDocument();
    expect(screen.getAllByText("del-101").length).toBeGreaterThan(0);
    expect(screen.getAllByText("user@example.com").length).toBeGreaterThan(0);
  });
});
