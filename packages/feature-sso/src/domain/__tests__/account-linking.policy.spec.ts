import { describe, expect, it } from "vitest";

import { decideAccountLinking } from "../account-linking.policy";

describe("decideAccountLinking", () => {
  it("creates a new account when no user has the email", () => {
    expect(decideAccountLinking({ existingUserByEmail: null })).toEqual({
      kind: "create_new",
    });
  });

  it("links to an existing user whose email is already verified", () => {
    expect(
      decideAccountLinking({
        existingUserByEmail: { id: "u1", emailVerifiedAt: new Date() },
      }),
    ).toEqual({ kind: "link_existing", userId: "u1" });
  });

  it("flags a conflict when the existing user email is unverified", () => {
    expect(
      decideAccountLinking({
        existingUserByEmail: { id: "u1", emailVerifiedAt: null },
      }),
    ).toEqual({ kind: "conflict" });
  });
});
