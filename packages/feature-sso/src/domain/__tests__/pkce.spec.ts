import { describe, expect, it } from "vitest";

import { computeCodeChallenge, generateCodeVerifier } from "../pkce";

describe("pkce", () => {
  it("generates a verifier", () => {
    const v = generateCodeVerifier();
    expect(v.length).toBeGreaterThan(20);
    expect(v).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("computes S256 challenge deterministically", () => {
    const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    const challenge = computeCodeChallenge(verifier);
    expect(challenge).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  });

  it("different verifiers produce different challenges", () => {
    expect(computeCodeChallenge("aaa")).not.toBe(computeCodeChallenge("bbb"));
  });
});
