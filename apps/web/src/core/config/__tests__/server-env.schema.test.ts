import { describe, expect, it } from "vitest";

import { webServerEnvSchema } from "../server-env.schema";

const base = {
  API_INTERNAL_URL: "http://localhost:3001",
  WEB_ORIGIN: "http://localhost:3000",
  APP_ENV: "development" as const,
  NODE_ENV: "development" as const,
};

describe("webServerEnvSchema", () => {
  it("allows CSRF_SECRET to be omitted in development", () => {
    const env = webServerEnvSchema.parse({ ...base });
    expect(env.CSRF_SECRET).toBeUndefined();
  });

  it("requires CSRF_SECRET in staging", () => {
    expect(() =>
      webServerEnvSchema.parse({
        ...base,
        APP_ENV: "staging",
        WEB_ORIGIN: "https://staging.example.com",
        API_INTERNAL_URL: "https://api.staging.example.com",
      }),
    ).toThrow(/CSRF_SECRET/);
  });

  it("accepts staging with a long CSRF_SECRET", () => {
    const env = webServerEnvSchema.parse({
      ...base,
      APP_ENV: "staging",
      WEB_ORIGIN: "https://staging.example.com",
      API_INTERNAL_URL: "https://api.staging.example.com",
      CSRF_SECRET: "d".repeat(32),
    });
    expect(env.CSRF_SECRET).toHaveLength(32);
  });
});
