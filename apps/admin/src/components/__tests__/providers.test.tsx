import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/web-ui/tooltip";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Providers } from "../providers";

describe("Providers", () => {
  it("renders children and provides TooltipProvider context to nested tooltips", () => {
    render(
      <Providers>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button">Trigger Button</button>
          </TooltipTrigger>
          <TooltipContent>Tooltip Information</TooltipContent>
        </Tooltip>
      </Providers>,
    );

    expect(screen.getByText("Trigger Button")).toBeInTheDocument();
  });
});
