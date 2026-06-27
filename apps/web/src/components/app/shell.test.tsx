import type { AnchorHTMLAttributes } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AppShell } from "@/components/app/shell";

const replaceMock = vi.fn();
const sessionState = {
  isLoading: false,
  isError: false,
  data: {
    data: {
      user: {
        displayName: "Admin User",
        email: "admin@example.local",
        roles: ["ADMIN"],
      },
      permissions: ["projects.read"],
    },
  },
};

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
  usePathname: () => "/projects",
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

vi.mock("@/hooks/use-session", () => ({
  useSession: () => sessionState,
}));

describe("AppShell", () => {
  it("shows only navigation items allowed by permissions", () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <AppShell>
          <div>Page content</div>
        </AppShell>
      </QueryClientProvider>,
    );

    expect(screen.getByText("Workspace")).toBeInTheDocument();
    expect(screen.getByText("Super Template")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Admin User")).toBeInTheDocument();
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });

  it("redirects to login when the session query fails", () => {
    sessionState.isError = true;

    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <AppShell>
          <div>Workspace</div>
        </AppShell>
      </QueryClientProvider>,
    );

    expect(replaceMock).toHaveBeenCalledWith("/login");
    sessionState.isError = false;
  });
});
