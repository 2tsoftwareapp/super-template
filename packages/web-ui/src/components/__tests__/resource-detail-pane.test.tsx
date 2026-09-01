// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ResourceDetailPane, type ResourceDetailTab } from "../resource-detail-pane";

describe("ResourceDetailPane Component", () => {
  afterEach(() => {
    cleanup();
  });

  it("does not render when open is false", () => {
    render(
      <ResourceDetailPane open={false} onClose={vi.fn()} title="User Details">
        <div>Content</div>
      </ResourceDetailPane>,
    );

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders when open is true with title, description, and ID", () => {
    const handleClose = vi.fn();
    render(
      <ResourceDetailPane
        open={true}
        onClose={handleClose}
        title="User Details"
        description="Detailed view of the user profile"
        id="usr_98765"
      >
        <div>Direct children content</div>
      </ResourceDetailPane>,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("User Details")).toBeInTheDocument();
    expect(screen.getByText("Detailed view of the user profile")).toBeInTheDocument();
    expect(screen.getByText("usr_98765")).toBeInTheDocument();
    expect(screen.getByText("Direct children content")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const handleClose = vi.fn();
    render(<ResourceDetailPane open={true} onClose={handleClose} title="Drawer" />);

    const closeBtn = screen.getByRole("button", { name: /close detail pane/i });
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("renders tabs and switches active tab on tab click", () => {
    const tabs: ResourceDetailTab[] = [
      { id: "general", label: "General", content: <div>General Tab Content</div> },
      { id: "security", label: "Security", content: <div>Security Tab Content</div> },
      { id: "audit", label: "Audit", content: <div>Audit Tab Content</div> },
    ];

    render(<ResourceDetailPane open={true} onClose={vi.fn()} title="Settings" tabs={tabs} />);

    expect(screen.getByRole("tablist")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /general/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("General Tab Content")).toBeInTheDocument();

    const securityTab = screen.getByRole("tab", { name: /security/i });
    fireEvent.click(securityTab);

    expect(screen.getByRole("tab", { name: /security/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Security Tab Content")).toBeInTheDocument();
    expect(screen.queryByText("General Tab Content")).toBeNull();
  });

  it("supports shorthand tab slots: overview, details, history, json", () => {
    render(
      <ResourceDetailPane
        open={true}
        onClose={vi.fn()}
        title="Resource Details"
        overview={<div>Overview Section</div>}
        details={<div>Details Section</div>}
        history={<div>History Section</div>}
        json={{ env: "production", version: "1.0.0" }}
      />,
    );

    expect(screen.getByRole("tab", { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /details/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /history/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /json/i })).toBeInTheDocument();

    expect(screen.getByText("Overview Section")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /json/i }));
    expect(screen.getByText(/"env": "production"/)).toBeInTheDocument();
  });

  it("handles keyboard navigation between tabs", () => {
    const tabs: ResourceDetailTab[] = [
      { id: "tab1", label: "Tab 1", content: <div>Content 1</div> },
      { id: "tab2", label: "Tab 2", content: <div>Content 2</div> },
    ];

    render(<ResourceDetailPane open={true} onClose={vi.fn()} title="Keyboard Test" tabs={tabs} />);

    const dialog = screen.getByRole("dialog");
    fireEvent.keyDown(dialog, { key: "ArrowRight" });

    expect(screen.getByRole("tab", { name: /tab 2/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Content 2")).toBeInTheDocument();

    fireEvent.keyDown(dialog, { key: "ArrowLeft" });
    expect(screen.getByRole("tab", { name: /tab 1/i })).toHaveAttribute("aria-selected", "true");
  });

  it("renders loading and error states", () => {
    const { rerender } = render(
      <ResourceDetailPane open={true} onClose={vi.fn()} title="Loading Test" isLoading />,
    );

    expect(screen.getByText(/loading details/i)).toBeInTheDocument();

    rerender(
      <ResourceDetailPane
        open={true}
        onClose={vi.fn()}
        title="Error Test"
        error={<div data-testid="err-msg">Failed to load</div>}
      />,
    );

    expect(screen.getByTestId("err-msg")).toBeInTheDocument();
  });

  it("renders footer and action buttons", () => {
    render(
      <ResourceDetailPane
        open={true}
        onClose={vi.fn()}
        title="Footer Test"
        footer={<button type="button">Save Changes</button>}
        actions={<button type="button">Edit</button>}
      >
        <div>Content</div>
      </ResourceDetailPane>,
    );

    expect(screen.getByRole("button", { name: "Save Changes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });
});
