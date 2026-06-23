import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Providers } from "@/components/providers";

const { setThemeMock, webFetchMock } = vi.hoisted(() => ({
  setThemeMock: vi.fn(),
  webFetchMock: vi.fn(),
}));

vi.mock("next-themes", async () => {
  const actual = await vi.importActual<typeof import("next-themes")>(
    "next-themes",
  );

  return {
    ...actual,
    useTheme: () => ({
      setTheme: setThemeMock,
    }),
  };
});

vi.mock("@/hooks/use-session", () => ({
  useSession: () => ({
    data: {
      data: {
        user: {
          id: "user-1",
        },
      },
    },
  }),
}));

vi.mock("@/lib/http", () => ({
  webFetch: webFetchMock,
}));

describe("Providers", () => {
  it("syncs the preferred theme after preferences load", async () => {
    webFetchMock.mockResolvedValue({
      data: {
        theme: "dark",
      },
    });

    render(
      <Providers>
        <div>Child</div>
      </Providers>,
    );

    await waitFor(() => {
      expect(setThemeMock).toHaveBeenCalledWith("dark");
    });
  });
});
