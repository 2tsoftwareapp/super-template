// @vitest-environment jsdom
/**
 * Smoke tests: every UI primitive renders without crashing.
 * These guard the package against broken internal imports after moves/refactors
 * (web-core is the single source of truth for UI — see the 2026-07-11
 * re-architecture roadmap, P1).
 */
import { render, screen, cleanup } from "@testing-library/react";
import { describe, expect, it, vi, afterEach, beforeAll } from "vitest";

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

import { Alert } from "../alert";
import { Avatar } from "../avatar";
import { Badge } from "../badge";
import { Button } from "../button";
import { Calendar } from "../calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../card";
import { Checkbox } from "../checkbox";
import { CommonResourcePage } from "../common-resource-page";
import { ConfirmDialog } from "../confirm-dialog";
import { DatePicker } from "../date-picker";
import { Empty } from "../empty";
import { ErrorState } from "../error-state";
import { Input } from "../input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../input-otp";
import { Label } from "../label";
import {
  FullScreenLoading,
  LoadingOverlay,
  PageLoading,
  SectionLoading,
  TableSkeleton,
} from "../loading";
import { LoadingButton } from "../loading-button";
import { Pagination } from "../pagination";
import { PasswordInput } from "../password-input";
import { RefreshButton } from "../refresh-button";
import { ResourceDataTable } from "../resource-data-table";
import { ResourceFilterBar } from "../resource-filter-bar";
import { ResourceDetailPane } from "../resource-detail-pane";
import {
  CopyableBadge,
  JsonCodeBlock,
  ResourcePropertyGrid,
  StatusBadge,
  TimestampValue,
} from "../resource-property-grid";
import { ResourceStatCard, ResourceStatCards } from "../resource-stat-cards";
import { Separator } from "../separator";
import { Sidebar, SidebarMenuButton, SidebarProvider } from "../sidebar";
import { Show } from "../show";
import { Skeleton } from "../skeleton";
import { Spinner } from "../spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../table";
import { Textarea } from "../textarea";
import { Tooltip, TooltipProvider } from "../tooltip";

describe("UI Component Smoke Tests", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders Alert", () => {
    render(<Alert>alert body</Alert>);
    expect(screen.getByText("alert body")).toBeInTheDocument();
  });

  it("renders Avatar", () => {
    const { container } = render(<Avatar name="Jane Doe" />);
    expect(container.firstChild).not.toBeNull();
  });

  it("renders Badge", () => {
    render(<Badge>new</Badge>);
    expect(screen.getByText("new")).toBeInTheDocument();
  });

  it("renders Button", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("renders Calendar", () => {
    const { container } = render(<Calendar />);
    expect(container.querySelector("table, [role='grid']")).not.toBeNull();
  });

  it("renders Card with sections", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Desc</CardDescription>
        </CardHeader>
        <CardContent>Body</CardContent>
      </Card>,
    );
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
  });

  it("renders Checkbox", () => {
    const { container } = render(<Checkbox />);
    expect(container.firstChild).not.toBeNull();
  });

  it("renders ConfirmDialog when open", () => {
    render(
      <ConfirmDialog
        open
        title="Delete item?"
        message="This cannot be undone."
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText("Delete item?")).toBeInTheDocument();
  });

  it("renders DatePicker", () => {
    const { container } = render(<DatePicker value="" onChange={vi.fn()} />);
    expect(container.querySelector("button")).not.toBeNull();
  });

  it("renders Empty", () => {
    render(<Empty title="Nothing here" />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  it("renders Input", () => {
    render(<Input placeholder="type here" />);
    expect(screen.getByPlaceholderText("type here")).toBeInTheDocument();
  });

  it("renders InputOTP", () => {
    const { container } = render(
      <InputOTP maxLength={6}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
        </InputOTPGroup>
      </InputOTP>,
    );
    expect(container.firstChild).not.toBeNull();
  });

  it("renders Label", () => {
    render(<Label htmlFor="x">A label</Label>);
    expect(screen.getByText("A label")).toBeInTheDocument();
  });

  it("renders ErrorState full-page", () => {
    render(<ErrorState title="Session error" description="Could not load your session." />);
    expect(screen.getByText("Session error")).toBeInTheDocument();
    expect(screen.getByText("Could not load your session.")).toBeInTheDocument();
  });

  it("renders ErrorState inline with action", () => {
    const onClick = vi.fn();
    render(
      <ErrorState title="Failed to load" variant="inline" action={{ label: "Retry", onClick }} />,
    );
    expect(screen.getByText("Failed to load")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("renders FullScreenLoading and SectionLoading", () => {
    render(<FullScreenLoading title="Loading things" description="wait" />);
    expect(screen.getByText("Loading things")).toBeInTheDocument();
    render(<SectionLoading />);
  });

  it("renders PageLoading", () => {
    const { container } = render(<PageLoading />);
    expect(container.firstChild).not.toBeNull();
  });

  it("renders LoadingOverlay", () => {
    const { container } = render(
      <LoadingOverlay loading>
        <div>content</div>
      </LoadingOverlay>,
    );
    expect(container.firstChild).not.toBeNull();
  });

  it("renders LoadingOverlay without overlay when not loading", () => {
    render(
      <LoadingOverlay loading={false}>
        <div>visible content</div>
      </LoadingOverlay>,
    );
    expect(screen.getByText("visible content")).toBeInTheDocument();
  });

  it("renders TableSkeleton", () => {
    const { container } = render(<TableSkeleton rows={3} columns={4} />);
    expect(container.firstChild).not.toBeNull();
  });

  it("renders LoadingButton", () => {
    render(<LoadingButton>Save</LoadingButton>);
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("renders LoadingButton with loading state", () => {
    render(<LoadingButton loading>Save</LoadingButton>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("renders Pagination", () => {
    render(<Pagination page={2} pageSize={20} totalPages={5} total={100} onPageChange={vi.fn()} />);
    expect(screen.getByText(/100/)).toBeInTheDocument();
  });

  it("renders PasswordInput", () => {
    render(<PasswordInput placeholder="secret" />);
    expect(screen.getByPlaceholderText("secret")).toBeInTheDocument();
  });

  it("renders RefreshButton idle", () => {
    render(<RefreshButton />);
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
  });

  it("renders RefreshButton with custom label", () => {
    render(<RefreshButton label="Reload" />);
    expect(screen.getByRole("button", { name: "Reload" })).toBeInTheDocument();
  });

  it("renders RefreshButton refreshing (spinner + disabled)", () => {
    render(<RefreshButton isRefreshing />);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders Separator", () => {
    const { container } = render(<Separator />);
    expect(container.firstChild).not.toBeNull();
  });

  it("renders Show when true", () => {
    render(<Show when>show-content-1</Show>);
    expect(screen.getByText("show-content-1")).toBeInTheDocument();
  });

  it("renders Show fallback when false", () => {
    render(
      <Show when={false} fallback={<span>fallback</span>}>
        hidden-content
      </Show>,
    );
    expect(screen.getByText("fallback")).toBeInTheDocument();
    expect(screen.queryByText("hidden-content")).not.toBeInTheDocument();
  });

  it("renders nothing when false without fallback", () => {
    const { container } = render(<Show when={false}>show-content-3</Show>);
    expect(container.firstChild).toBeNull();
  });

  it("renders Skeleton", () => {
    const { container } = render(<Skeleton className="h-4 w-24" />);
    expect(container.firstChild).not.toBeNull();
  });

  it("renders Spinner", () => {
    const { container } = render(<Spinner />);
    expect(container.firstChild).not.toBeNull();
  });

  it("renders Table", () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Col</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByText("Cell")).toBeInTheDocument();
  });

  it("renders Textarea", () => {
    render(<Textarea placeholder="notes" />);
    expect(screen.getByPlaceholderText("notes")).toBeInTheDocument();
  });

  it("renders Tooltip convenience API without content", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <button type="button">bare trigger</button>
        </Tooltip>
      </TooltipProvider>,
    );
    expect(screen.getByText("bare trigger")).toBeInTheDocument();
  });

  it("renders Tooltip convenience API with content", () => {
    render(
      <TooltipProvider>
        <Tooltip content="tip text">
          <button type="button">hover me</button>
        </Tooltip>
      </TooltipProvider>,
    );
    expect(screen.getByText("hover me")).toBeInTheDocument();
  });

  it("renders ResourceStatCards and ResourceStatCard", () => {
    render(
      <ResourceStatCards items={[{ label: "Active", value: 42, description: "Total active" }]} />,
    );
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders ResourcePropertyGrid", () => {
    render(
      <ResourcePropertyGrid
        properties={[
          { label: "Status", value: "active", type: "status" },
          { label: "ID", value: "item-123", type: "id" },
        ]}
      />,
    );
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("active")).toBeInTheDocument();
    expect(screen.getByText("item-123")).toBeInTheDocument();
  });

  it("renders ResourceDetailPane", () => {
    render(
      <ResourceDetailPane open={true} onClose={() => {}} title="Detail Smoke Test">
        <div>Pane Content</div>
      </ResourceDetailPane>,
    );
    expect(screen.getByText("Detail Smoke Test")).toBeInTheDocument();
    expect(screen.getByText("Pane Content")).toBeInTheDocument();
  });

  it("renders CommonResourcePage", () => {
    const dummyResource = {
      id: "items",
      label: "Items",
      group: "System" as const,
      path: "/items",
      icon: () => null,
      features: ["list" as const],
      queryKey: "items",
    };
    render(
      <CommonResourcePage resource={dummyResource} description="Common Resource Page Smoke Test">
        <div>Page Content</div>
      </CommonResourcePage>,
    );
    expect(screen.getByText("Items")).toBeInTheDocument();
    expect(screen.getByText("Common Resource Page Smoke Test")).toBeInTheDocument();
    expect(screen.getByText("Page Content")).toBeInTheDocument();
  });

  it("renders ResourceFilterBar", () => {
    render(
      <ResourceFilterBar
        search={{ value: "test", onChange: () => {}, placeholder: "Search..." }}
      />,
    );
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders ResourceDataTable", () => {
    const dummyTable = {
      getHeaderGroups: () => [],
      getVisibleLeafColumns: () => [],
      getAllLeafColumns: () => [],
      getState: () => ({ sorting: [] }),
      getRowModel: () => ({ rows: [] }),
    } as unknown as Parameters<typeof ResourceDataTable>[0]["table"];
    render(<ResourceDataTable table={dummyTable} />);
    expect(screen.getByText("No results found")).toBeInTheDocument();
  });

  it("renders SidebarProvider and SidebarMenuButton with tooltip without crashing", () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarMenuButton tooltip="Dashboard tooltip">
            <span>Dashboard</span>
          </SidebarMenuButton>
        </Sidebar>
      </SidebarProvider>,
    );
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });
});
