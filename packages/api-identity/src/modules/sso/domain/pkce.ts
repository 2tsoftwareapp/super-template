import { createHash, randomBytes } from "node:crypto";

export const generateCodeVerifier = (): string => randomBytes(32).toString("base64url");

// PKCE S256: base64url(sha256(verifier)), per RFC 7636.
export const computeCodeChallenge = (verifier: string): string =>
  createHash("sha256").update(verifier).digest("base64url");
