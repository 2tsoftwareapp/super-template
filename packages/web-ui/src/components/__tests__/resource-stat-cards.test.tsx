// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { Users } from "lucide-react";
import { afterEach, describe, expect, it } from "vitest";

import {
  ResourceStatCard,
  ResourceStatCards,
  ResourceStatCardSkeleton,
} from "../resource-stat-cards";

describe("ResourceStatCards Component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders a single ResourceStatCard with basic props", () => {
    render(<ResourceStatCard label="Total Users" value="1,248" description="Active this month" />);

    expect(screen.getByText("Total Users")).toBeInTheDocument();
    expect(screen.getByText("1,248")).toBeInTheDocument();
    expect(screen.getByText("Active this month")).toBeInTheDocument();
  });

  it("renders with positive change indicator", () => {
    render(
      <ResourceStatCard
        label="Revenue"
        value="$45,200"
        change={{ value: "+12.5%", positive: true }}
      />,
    );

    expect(screen.getByText("+12.5%")).toBeInTheDocument();
  });

  it("renders with negative change indicator", () => {
    render(
      <ResourceStatCard
        label="Bounce Rate"
        value="24.3%"
        change={{ value: "-4.2%", positive: false }}
      />,
    );

    expect(screen.getByText("-4.2%")).toBeInTheDocument();
  });

  it("renders with icon and trend", () => {
    render(<ResourceStatCard label="Subscribers" value="520" icon={Users} trend="vs last week" />);

    expect(screen.getByText("520")).toBeInTheDocument();
    expect(screen.getByText("vs last week")).toBeInTheDocument();
  });

  it("renders as anchor when href is provided", () => {
    render(<ResourceStatCard label="Clickable Metric" value="99" href="/metrics/detail" />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/metrics/detail");
  });

  it("renders custom linkComponent when provided", () => {
    const CustomLink = ({
      href,
      children,
      className,
    }: {
      href: string;
      children?: React.ReactNode | undefined;
      className?: string | undefined;
    }) => (
      <a href={href} data-testid="custom-link" className={className}>
        {children}
      </a>
    );

    render(
      <ResourceStatCard
        label="Custom Link"
        value="100"
        href="/custom"
        linkComponent={CustomLink}
      />,
    );

    expect(screen.getByTestId("custom-link")).toBeInTheDocument();
  });

  it("renders grid of stat cards", () => {
    const items = [
      { label: "Card 1", value: "10" },
      { label: "Card 2", value: "20" },
      { label: "Card 3", value: "30" },
    ];

    render(<ResourceStatCards items={items} columns={3} />);

    expect(screen.getByTestId("stat-cards-grid")).toBeInTheDocument();
    expect(screen.getByText("Card 1")).toBeInTheDocument();
    expect(screen.getByText("Card 2")).toBeInTheDocument();
    expect(screen.getByText("Card 3")).toBeInTheDocument();
  });

  it("renders skeleton state when isLoading is true", () => {
    render(<ResourceStatCards isLoading skeletonCount={4} />);

    expect(screen.getByTestId("stat-cards-skeleton")).toBeInTheDocument();
  });

  it("renders null when items is empty and not loading", () => {
    const { container } = render(<ResourceStatCards items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders ResourceStatCardSkeleton standalone", () => {
    const { container } = render(<ResourceStatCardSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
