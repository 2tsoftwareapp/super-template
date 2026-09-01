import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { BulkActionBar } from "../bulk-action-bar";

describe("BulkActionBar re-export", () => {
  it("renders selected record count and clear button", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();

    render(
      <BulkActionBar
        selectedCount={3}
        onClear={onClear}
        actions={<button type="button">Delete</button>}
      />,
    );

    expect(screen.getByText("3 records selected")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();

    const clearButton = screen.getByRole("button", { name: "Clear selection" });
    await user.click(clearButton);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("does not render when selectedCount is 0", () => {
    render(<BulkActionBar selectedCount={0} onClear={vi.fn()} />);
    expect(screen.queryByText(/selected/i)).toBeNull();
  });
});
