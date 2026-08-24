import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Providers } from "@/app/providers";

describe("Providers", () => {
  it("renders children for the application shell", () => {
    render(
      <Providers>
        <div>Child</div>
      </Providers>,
    );

    expect(screen.getByText("Child")).toBeInTheDocument();
  });
});
