import { afterEach, describe, expect, it } from "vitest";

import { assertDestructiveCliAllowed } from "../assert-destructive-cli";

const KEYS = ["APP_ENV", "ALLOW_PROD_SEED", "ALLOW_PROD_RESET"] as const;
const saved: Partial<Record<(typeof KEYS)[number], string | undefined>> = {};

afterEach(() => {
  for (const key of KEYS) {
    const value = saved[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

const snapshotEnv = (): void => {
  for (const key of KEYS) {
    saved[key] = process.env[key];
  }
};

snapshotEnv();

describe("assertDestructiveCliAllowed", () => {
  it("allows seed in development without an override", () => {
    process.env.APP_ENV = "development";
    delete process.env.ALLOW_PROD_SEED;
    expect(() =>
      assertDestructiveCliAllowed({ action: "db:seed", overrideEnv: "ALLOW_PROD_SEED" }),
    ).not.toThrow();
  });

  it("allows seed in test without an override", () => {
    process.env.APP_ENV = "test";
    delete process.env.ALLOW_PROD_SEED;
    expect(() =>
      assertDestructiveCliAllowed({ action: "db:seed", overrideEnv: "ALLOW_PROD_SEED" }),
    ).not.toThrow();
  });

  it("refuses seed in production without an override", () => {
    process.env.APP_ENV = "production";
    delete process.env.ALLOW_PROD_SEED;
    expect(() =>
      assertDestructiveCliAllowed({ action: "db:seed", overrideEnv: "ALLOW_PROD_SEED" }),
    ).toThrow(/ALLOW_PROD_SEED=1/);
  });

  it("refuses reset in staging without an override", () => {
    process.env.APP_ENV = "staging";
    delete process.env.ALLOW_PROD_RESET;
    expect(() =>
      assertDestructiveCliAllowed({ action: "db:reset", overrideEnv: "ALLOW_PROD_RESET" }),
    ).toThrow(/ALLOW_PROD_RESET=1/);
  });

  it("allows seed in production when ALLOW_PROD_SEED=1", () => {
    process.env.APP_ENV = "production";
    process.env.ALLOW_PROD_SEED = "1";
    expect(() =>
      assertDestructiveCliAllowed({ action: "db:seed", overrideEnv: "ALLOW_PROD_SEED" }),
    ).not.toThrow();
  });
});
