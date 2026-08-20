import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ResourceTable } from "../resource-table";

interface HarnessProps {
  error?: { title: string; description?: string };
  onRetry?: () => void;
}

function Harness({ error, onRetry }: HarnessProps) {
  // eslint-disable-next-line react-hooks/incompatible-library -- useReactTable is the supported table API
  const table = useReactTable({
    data: [],
    columns: [{ accessorKey: "id", header: "ID" }],
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <ResourceTable
      table={table}
      emptyTitle="No rows"
      {...(error ? { error } : {})}
      {...(onRetry ? { onRetry } : {})}
    />
  );
}

describe("ResourceTable error state", () => {
  it("renders Empty when no error", () => {
    render(<Harness />);
    expect(screen.getByText("No rows")).toBeTruthy();
    expect(screen.queryByText("Failed to load")).toBeNull();
  });

  it("renders ErrorState with retry when error set", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <Harness
        error={{ title: "Failed to load", description: "Try again later" }}
        onRetry={onRetry}
      />,
    );

    expect(screen.getByText("Failed to load")).toBeTruthy();
    expect(screen.queryByText("No rows")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders ErrorState without retry button when onRetry absent", () => {
    render(<Harness error={{ title: "Failed to load" }} />);
    expect(screen.getByText("Failed to load")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
  });
});
