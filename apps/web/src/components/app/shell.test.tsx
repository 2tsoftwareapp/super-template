import type { AnchorHTMLAttributes } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { AppShell } from "@/components/app/shell";
import { describe, expect, it, vi } from "vitest";

const replaceMock = vi.fn();
const sessionState = {
  isLoading: false,
  isError: false,
  data: {
    data: {
      user: {
        displayName: "Admin User",
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
          <div>Workspace</div>
        </AppShell>
      </QueryClientProvider>,
    );

    expect(screen.getByText("Client")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Admin overview")).toBeInTheDocument();
    expect(screen.queryByText("Users")).not.toBeInTheDocument();
    expect(screen.queryByText("Notifications")).not.toBeInTheDocument();
    expect(screen.getByText("Workspace")).toBeInTheDocument();
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
