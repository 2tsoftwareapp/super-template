import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TopHeader } from "../top-header";

let mockPathname = "/";

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/i18n", () => ({
  useI18n: () => ({
    locale: "en",
    setLocale: vi.fn(),
    t: (key: string) => {
      const dict: Record<string, string> = {
        "nav.dashboard": "Dashboard",
        "nav.users": "Users",
        "nav.organizations": "Organizations",
        "nav.roles": "Roles",
        "nav.settings": "Settings",
        "nav.security": "Security",
        "nav.password": "Password",
        "shell.settings": "Settings",
        "shell.security": "Account security",
        "shell.signOut": "Sign out",
      };
      return dict[key] ?? key;
    },
  }),
}));

vi.mock("@/features/organizations/ui/organization-switcher", () => ({
  OrganizationSwitcher: () => <div data-testid="org-switcher">Org Switcher</div>,
}));

vi.mock("@repo/web-ui/sidebar", () => ({
  SidebarTrigger: () => <button type="button">Toggle Sidebar</button>,
}));

describe("TopHeader and Breadcrumbs", () => {
  it("renders Dashboard breadcrumb when on root path", () => {
    mockPathname = "/";
    render(<TopHeader displayName="Super Admin" onSignOut={vi.fn()} />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("org-switcher")).toBeInTheDocument();
  });

  it("renders nested resource breadcrumbs with links for parent segments", () => {
    mockPathname = "/settings/security";
    render(<TopHeader displayName="Super Admin" onSignOut={vi.fn()} />);

    const settingsLink = screen.getByRole("link", { name: "Settings" });
    expect(settingsLink).toHaveAttribute("href", "/settings");
    expect(screen.getByText("Security")).toBeInTheDocument();
  });

  it("renders dynamic entity id segment cleanly", () => {
    mockPathname = "/users/usr_abc123";
    render(<TopHeader displayName="Super Admin" onSignOut={vi.fn()} />);

    const usersLink = screen.getByRole("link", { name: "Users" });
    expect(usersLink).toHaveAttribute("href", "/users");
    expect(screen.getByText("#usr_abc123")).toBeInTheDocument();
  });

  it("calls onSignOut when clicking sign out in user dropdown", async () => {
    mockPathname = "/";
    const user = userEvent.setup();
    const onSignOut = vi.fn();

    render(<TopHeader displayName="Jane Doe" onSignOut={onSignOut} />);

    const avatarBtn = screen.getByRole("button", { name: "Jane Doe" });
    await user.click(avatarBtn);

    const signOutBtn = screen.getByText("Sign out");
    await user.click(signOutBtn);
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });
});
