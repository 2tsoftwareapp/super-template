import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { VerifyEmailContent } from "../verify-email-content";

describe("VerifyEmailContent", () => {
  it("renders the verifying state", () => {
    render(<VerifyEmailContent status="verifying" message="" />);

    expect(screen.getByText("Verifying your email...")).toBeInTheDocument();
    expect(screen.queryByText("Email verified!")).not.toBeInTheDocument();
  });

  it("renders the success state and message", () => {
    render(<VerifyEmailContent status="success" message="Account activated." />);

    expect(screen.getByText("Email verified!")).toBeInTheDocument();
    expect(screen.getByText("Account activated.")).toBeInTheDocument();
    expect(screen.getByText("Redirecting to admin...")).toBeInTheDocument();
  });

  it("renders the safe error state", () => {
    render(<VerifyEmailContent status="error" message="Verification failed." />);

    expect(screen.getByText("Verification failed")).toBeInTheDocument();
    expect(screen.getByText("Verification failed.")).toBeInTheDocument();
  });
});
