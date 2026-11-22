import { createHash } from "node:crypto";

/** Refresh and reset tokens are stored as SHA-256: a database leak does not hand out sessions. */
export const hashToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");
