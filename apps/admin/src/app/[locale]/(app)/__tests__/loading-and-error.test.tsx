import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import AppError from "../error";
import AppLoading from "../loading";

vi.mock("@/lib/i18n", () => ({
  useI18n: () => ({
    locale: "en",
    setLocale: vi.fn(),
    t: (key: string) => {
      const messages: Record<string, string> = {
        "errors.title": "Something went wrong",
        "errors.description": "An unexpected error occurred while loading this section.",
        "errors.digest": "Error digest",
        "errors.reset": "Try again",
      };
      return messages[key] ?? key;
    },
  }),
}));

describe("AppLoading", () => {
  it("renders the loading skeleton shell", () => {
    render(<AppLoading />);
    const skeleton = screen.getByTestId("app-loading-skeleton");
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute("aria-busy", "true");
  });
});

describe("AppError", () => {
  it("renders localized error title, description, and reset button", async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    const error = new Error("Test error message");

    render(<AppError error={error} reset={reset} />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(
      screen.getByText("An unexpected error occurred while loading this section."),
    ).toBeInTheDocument();

    const retryBtn = screen.getByRole("button", { name: "Try again" });
    await user.click(retryBtn);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("displays error digest when available", () => {
    const error = Object.assign(new Error("Database connection failed"), {
      digest: "ERR_12345",
    });

    render(<AppError error={error} reset={vi.fn()} />);

    expect(screen.getByText("ERR_12345")).toBeInTheDocument();
    expect(screen.getByText(/Error digest/i)).toBeInTheDocument();
  });
});
