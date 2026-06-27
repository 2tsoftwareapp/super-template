import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Providers } from "@/components/providers";

const { setThemeMock, webFetchMock } = vi.hoisted(() => ({
  setThemeMock: vi.fn(),
  webFetchMock: vi.fn(),
}));

vi.mock("@/lib/theme", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useTheme: () => ({
    theme: "system",
    resolvedTheme: "light",
    setTheme: setThemeMock,
  }),
}));

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
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { ok: true } }))),
    );
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
