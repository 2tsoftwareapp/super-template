import type { AnchorHTMLAttributes } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "./page";
import { describe, expect, it, vi } from "vitest";

const replaceMock = vi.fn();
const webFetchMock = vi.fn();

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/http", () => ({
  webFetch: webFetchMock,
}));

describe("LoginPage", () => {
  it("does not submit when validation fails", async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>,
    );

    const email = screen.getByDisplayValue("admin@example.local");
    const password = screen.getByDisplayValue("ChangeMe123!");

    await user.clear(email);
    await user.type(email, "not-an-email");
    await user.clear(password);
    await user.type(password, "short");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(webFetchMock).not.toHaveBeenCalled();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("redirects signed-in users to the landing page", async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient();

    webFetchMock.mockResolvedValueOnce({
      data: {
        user: {
          displayName: "Template User",
          roles: ["USER"],
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(replaceMock).toHaveBeenCalledWith("/");
  });
});
