import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { NotificationsViewModel } from "@/features/notifications/model/notifications.types";
import type { NotificationDto, NotificationJobDto } from "@/lib/api-types";

import { NotificationsListView } from "../notifications-list-view";

const mockJob: NotificationJobDto = {
  id: "job-101",
  title: "System Update",
  body: "Scheduled maintenance tonight",
  type: "SYSTEM",
  audience: "ALL",
  status: "COMPLETED",
  createdAt: "2026-03-01T12:00:00Z",
  updatedAt: "2026-03-01T12:01:00Z",
  scheduledAt: "2026-03-01T12:00:00Z",
  actorId: "usr-admin",
  data: {},
};

const mockNotification: NotificationDto = {
  id: "notif-201",
  userId: "usr-1",
  title: "Welcome to Platform",
  body: "Your account is active.",
  type: "INFO",
  createdAt: "2026-03-01T12:00:00Z",
  data: {},
};

function TestHarness(props: Partial<NotificationsViewModel>) {
  // eslint-disable-next-line react-hooks/incompatible-library -- React Table standard hook
  const table = useReactTable({
    data: [mockJob],
    columns: [
      { accessorKey: "id", header: "ID" },
      { accessorKey: "title", header: "Title" },
    ],
    getCoreRowModel: getCoreRowModel(),
  });

  const defaultProps: NotificationsViewModel = {
    isRefreshing: false,
    onRefresh: vi.fn(),
    compose: {
      canAccess: true,
      isSending: false,
      isError: false,
      onSubmit: vi.fn(),
    },
    jobs: {
      isLoading: false,
      isError: false,
      onRetry: vi.fn(),
      onRefresh: vi.fn(),
    },
    recent: {
      isLoading: false,
      isError: false,
      onRetry: vi.fn(),
      data: [mockNotification],
    },
    table,
    ...props,
  };

  return <NotificationsListView {...defaultProps} />;
}

describe("NotificationsListView", () => {
  it("renders notifications list with CommonResourcePage, compose form, delivery jobs, and recent notifications", () => {
    render(<TestHarness />);

    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(
      screen.getByText("Send test notifications and manage delivery jobs."),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Send test notification").length).toBeGreaterThan(0);
    expect(screen.getByText("Delivery jobs")).toBeInTheDocument();
    expect(screen.getByText("Recent notifications")).toBeInTheDocument();
    expect(screen.getByText("System Update")).toBeInTheDocument();
    expect(screen.getByText("Welcome to Platform")).toBeInTheDocument();
    expect(screen.getByText("Your account is active.")).toBeInTheDocument();
  });

  it("hides compose form when user does not have permission", () => {
    render(
      <TestHarness
        compose={{
          canAccess: false,
          isSending: false,
          isError: false,
          onSubmit: vi.fn(),
        }}
      />,
    );

    expect(screen.queryByText("Send test notification")).not.toBeInTheDocument();
    expect(screen.getByText("Delivery jobs")).toBeInTheDocument();
    expect(screen.getByText("Recent notifications")).toBeInTheDocument();
  });

  it("handles loading state for recent notifications", () => {
    render(
      <TestHarness
        recent={{
          isLoading: true,
          isError: false,
          onRetry: vi.fn(),
          data: [],
        }}
      />,
    );

    expect(screen.queryByText("Welcome to Platform")).not.toBeInTheDocument();
  });

  it("handles error state and triggers retry for recent notifications", () => {
    const onRetryMock = vi.fn();
    render(
      <TestHarness
        recent={{
          isLoading: false,
          isError: true,
          onRetry: onRetryMock,
          data: [],
        }}
      />,
    );

    expect(screen.getByText("Could not load recent notifications.")).toBeInTheDocument();
    const retryButton = screen.getByRole("button", { name: /retry/i });
    fireEvent.click(retryButton);
    expect(onRetryMock).toHaveBeenCalledTimes(1);
  });

  it("handles empty state for recent notifications", () => {
    render(
      <TestHarness
        recent={{
          isLoading: false,
          isError: false,
          onRetry: vi.fn(),
          data: [],
        }}
      />,
    );

    expect(screen.getByText("No recent notifications")).toBeInTheDocument();
  });
});
