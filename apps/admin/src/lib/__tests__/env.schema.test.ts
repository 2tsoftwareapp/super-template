import { describe, expect, it } from "vitest";

import { adminEnvSchema } from "../env.schema";

const base = {
  API_INTERNAL_URL: "http://localhost:3001",
  ADMIN_ORIGIN: "http://localhost:3002",
  APP_ENV: "development" as const,
  NEXT_PUBLIC_APP_ENV: "development" as const,
  NODE_ENV: "development" as const,
};

describe("adminEnvSchema", () => {
  it("allows CSRF_SECRET to be omitted in development", () => {
    const env = adminEnvSchema.parse({ ...base });
    expect(env.CSRF_SECRET).toBeUndefined();
  });

  it("requires CSRF_SECRET in production", () => {
    expect(() =>
      adminEnvSchema.parse({
        ...base,
        APP_ENV: "production",
        NEXT_PUBLIC_APP_ENV: "production",
        ADMIN_ORIGIN: "https://admin.example.com",
        API_INTERNAL_URL: "https://api.example.com",
      }),
    ).toThrow(/CSRF_SECRET/);
  });

  it("accepts a production environment with a long CSRF_SECRET", () => {
    const env = adminEnvSchema.parse({
      ...base,
      APP_ENV: "production",
      NEXT_PUBLIC_APP_ENV: "production",
      ADMIN_ORIGIN: "https://admin.example.com",
      API_INTERNAL_URL: "https://api.example.com",
      CSRF_SECRET: "c".repeat(24),
    });
    expect(env.CSRF_SECRET).toHaveLength(24);
  });
});
