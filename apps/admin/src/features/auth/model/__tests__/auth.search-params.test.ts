import { describe, expect, it } from "vitest";

import { AUTH_ERROR_QUERY_VALUES } from "../auth.constants";
import { parseAuthLoginSearchParams, parseSsoCallbackSearchParams } from "../auth.search-params";

describe("parseAuthLoginSearchParams", () => {
  it("keeps a known SSO error flag", () => {
    const sp = new URLSearchParams(`error=${AUTH_ERROR_QUERY_VALUES.ssoFailed}`);
    expect(parseAuthLoginSearchParams(sp)).toEqual({
      error: AUTH_ERROR_QUERY_VALUES.ssoFailed,
    });
  });

  it("recovers unknown error values to undefined", () => {
    expect(parseAuthLoginSearchParams(new URLSearchParams("error=nope"))).toEqual({
      error: undefined,
    });
  });
});

describe("parseSsoCallbackSearchParams", () => {
  it("parses a present exchange code", () => {
    expect(parseSsoCallbackSearchParams(new URLSearchParams("exchange=abc123"))).toEqual({
      error: undefined,
      exchange: "abc123",
    });
  });

  it("defaults a missing exchange to empty string", () => {
    expect(parseSsoCallbackSearchParams(new URLSearchParams())).toEqual({
      error: undefined,
      exchange: "",
    });
  });
});
