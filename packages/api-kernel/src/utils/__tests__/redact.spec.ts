import { describe, expect, it } from "vitest";

import { redactRequestUrl, redactSensitive } from "../redact";

describe("redactSensitive", () => {
  it("redacts sensitive keys regardless of key casing", () => {
    expect(
      redactSensitive({
        Authorization: "Bearer secret",
        nested: {
          password: "plain-text",
          RefreshToken: "refresh-secret",
        },
      }),
    ).toEqual({
      Authorization: "[REDACTED]",
      nested: {
        password: "[REDACTED]",
        RefreshToken: "[REDACTED]",
      },
    });
  });

  it("preserves non-sensitive values while traversing arrays", () => {
    expect(
      redactSensitive([{ token: "secret" }, { label: "safe", access: { foo: "bar" } }]),
    ).toEqual([{ token: "[REDACTED]" }, { label: "safe", access: { foo: "bar" } }]);
  });

  it("handles circular references without overflowing the stack", () => {
    const node: Record<string, unknown> = { label: "root", password: "secret" };
    node.self = node;

    const result = redactSensitive(node) as Record<string, unknown>;

    expect(result.label).toBe("root");
    expect(result.password).toBe("[REDACTED]");
    expect(result.self).toBe("[Circular]");
  });
});

describe("redactRequestUrl", () => {
  it("keeps pagination/filter keys and redacts every other value", () => {
    expect(redactRequestUrl("/api/v1/admin/users?page=2&limit=50&email=a@b.com")).toBe(
      "/api/v1/admin/users?page=2&limit=50&email=%5BREDACTED%5D",
    );
  });

  it("redacts OAuth callback values", () => {
    expect(redactRequestUrl("/api/v1/auth/sso/google/callback?code=abc&state=xyz")).toBe(
      "/api/v1/auth/sso/google/callback?code=%5BREDACTED%5D&state=%5BREDACTED%5D",
    );
  });

  it("leaves a URL without a query string untouched", () => {
    expect(redactRequestUrl("/health")).toBe("/health");
  });
});
