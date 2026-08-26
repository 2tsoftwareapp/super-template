import { describe, expect, it } from "vitest";

import { ERROR_CODES } from "../../constants/error-codes";
import { AppError } from "../../errors/app-error";
import { requireOrganizationId } from "../require-organization";

describe("requireOrganizationId", () => {
  it("returns the organization id when present", () => {
    expect(requireOrganizationId({ organizationId: "org-1" })).toBe("org-1");
  });

  it.each([null, undefined, ""])(
    "throws AUTH_FORBIDDEN when organizationId is %s",
    (organizationId) => {
      try {
        requireOrganizationId({ organizationId: organizationId as string });
        throw new Error("expected requireOrganizationId to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).code).toBe(ERROR_CODES.AUTH_FORBIDDEN);
      }
    },
  );
});
