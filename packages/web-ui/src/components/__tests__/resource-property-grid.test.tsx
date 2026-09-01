// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CopyableBadge,
  JsonCodeBlock,
  ResourcePropertyGrid,
  type ResourcePropertyItem,
  StatusBadge,
  TimestampValue,
} from "../resource-property-grid";

describe("ResourcePropertyGrid Component", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe("CopyableBadge", () => {
    it("renders value and copy button", () => {
      render(<CopyableBadge value="usr_123456789" label="User ID" />);

      expect(screen.getByText("usr_123456789")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /copy user id/i })).toBeInTheDocument();
    });

    it("copies text to clipboard when copy button is clicked", async () => {
      render(<CopyableBadge value="usr_123456789" label="User ID" />);

      const copyBtn = screen.getByRole("button", { name: /copy user id/i });
      fireEvent.click(copyBtn);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("usr_123456789");
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /copied/i })).toBeInTheDocument();
      });
    });

    it("truncates long value when truncated is true", () => {
      render(<CopyableBadge value="0x1234567890abcdef1234567890abcdef" truncated maxLength={10} />);

      expect(screen.getByText("0x123...bcdef")).toBeInTheDocument();
    });
  });

  describe("JsonCodeBlock", () => {
    it("renders formatted JSON", () => {
      const data = { name: "John", age: 30 };
      render(<JsonCodeBlock data={data} />);

      expect(screen.getByText(/"name": "John"/)).toBeInTheDocument();
      expect(screen.getByText(/"age": 30/)).toBeInTheDocument();
    });

    it("supports copy button", async () => {
      const data = { status: "ok" };
      render(<JsonCodeBlock data={data} />);

      const copyBtn = screen.getByRole("button", { name: /copy json/i });
      fireEvent.click(copyBtn);

      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /copied json/i })).toBeInTheDocument();
      });
    });

    it("supports collapsible mode", () => {
      const data = { key: "value" };
      render(<JsonCodeBlock data={data} collapsible defaultExpanded />);

      const collapseBtn = screen.getByRole("button", { name: /collapse/i });
      expect(collapseBtn).toBeInTheDocument();

      fireEvent.click(collapseBtn);
      expect(screen.getByRole("button", { name: /expand/i })).toBeInTheDocument();
    });
  });

  describe("StatusBadge", () => {
    it("renders status with dot indicator and variant styles", () => {
      render(<StatusBadge status="active" variant="success" />);

      expect(screen.getByText("active")).toBeInTheDocument();
    });

    it("renders status without dot when dot is false", () => {
      const { container } = render(<StatusBadge status="pending" variant="warning" dot={false} />);

      expect(screen.getByText("pending")).toBeInTheDocument();
      expect(container.querySelector(".rounded-full.size-1\\.5")).toBeNull();
    });
  });

  describe("TimestampValue", () => {
    it("renders formatted timestamp", () => {
      const date = new Date("2026-08-15T12:00:00Z");
      render(<TimestampValue value={date} format="date" />);

      const timeEl = screen.getByText(/Aug 15, 2026/);
      expect(timeEl).toBeInTheDocument();
      expect(timeEl).toHaveAttribute("dateTime", date.toISOString());
    });

    it("handles invalid date strings gracefully", () => {
      render(<TimestampValue value="not-a-date" />);
      expect(screen.getByText("not-a-date")).toBeInTheDocument();
    });
  });

  describe("ResourcePropertyGrid", () => {
    it("renders multiple property items of various types", () => {
      const properties: ResourcePropertyItem[] = [
        { label: "ID", value: "usr_abc123", type: "id" },
        { label: "Status", value: "active", type: "status", statusVariant: "success" },
        { label: "Role", value: "Admin", type: "badge", badgeVariant: "default" },
        { label: "Created At", value: "2026-08-01T00:00:00Z", type: "timestamp" },
        { label: "Website", value: "example.com", type: "link", href: "https://example.com" },
        { label: "Command", value: "bun test", type: "code" },
        { label: "Description", value: "A sample resource", description: "Internal notes" },
      ];

      render(<ResourcePropertyGrid properties={properties} />);

      expect(screen.getByTestId("resource-property-grid")).toBeInTheDocument();
      expect(screen.getByText("ID")).toBeInTheDocument();
      expect(screen.getByText("usr_abc123")).toBeInTheDocument();
      expect(screen.getByText("Status")).toBeInTheDocument();
      expect(screen.getByText("active")).toBeInTheDocument();
      expect(screen.getByText("Role")).toBeInTheDocument();
      expect(screen.getByText("Admin")).toBeInTheDocument();
      expect(screen.getByText("Website")).toBeInTheDocument();
      expect(screen.getByText("example.com")).toBeInTheDocument();
      expect(screen.getByText("Command")).toBeInTheDocument();
      expect(screen.getByText("bun test")).toBeInTheDocument();
      expect(screen.getByText("Description")).toBeInTheDocument();
      expect(screen.getByText("A sample resource")).toBeInTheDocument();
      expect(screen.getByText("Internal notes")).toBeInTheDocument();
    });

    it("renders emptyText or placeholder when value is empty", () => {
      const properties: ResourcePropertyItem[] = [
        { label: "Empty Field", value: null },
        { label: "With Placeholder", value: undefined, placeholder: "None" },
      ];

      render(<ResourcePropertyGrid properties={properties} emptyText="N/A" />);

      expect(screen.getByText("N/A")).toBeInTheDocument();
      expect(screen.getByText("None")).toBeInTheDocument();
    });

    it("renders JSON property spanning full column", () => {
      const properties: ResourcePropertyItem[] = [
        { label: "Metadata", value: { plan: "enterprise" }, type: "json" },
      ];

      render(<ResourcePropertyGrid properties={properties} columns={2} />);

      expect(screen.getByText("Metadata")).toBeInTheDocument();
      expect(screen.getByText(/"plan": "enterprise"/)).toBeInTheDocument();
    });

    it("renders null when properties array is empty", () => {
      const { container } = render(<ResourcePropertyGrid properties={[]} />);
      expect(container.firstChild).toBeNull();
    });
  });
});
