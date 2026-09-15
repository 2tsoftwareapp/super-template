import { describe, expect, it } from "vitest";

import { isMandatoryMailTemplate, MANDATORY_MAIL_TEMPLATE_KEYS } from "../mandatory-mail-templates";

describe("mandatory-mail-templates", () => {
  it("lists the account-critical templates exactly", () => {
    expect(MANDATORY_MAIL_TEMPLATE_KEYS).toEqual(["auth.verify-email", "auth.reset-password"]);
  });

  it.each(MANDATORY_MAIL_TEMPLATE_KEYS)("treats %s as mandatory", (templateKey) => {
    expect(isMandatoryMailTemplate(templateKey)).toBe(true);
  });

  it.each(["auth.welcome", "auth.reset-password-reminder", "", "AUTH.VERIFY-EMAIL"])(
    "treats %j as optional",
    (templateKey) => {
      expect(isMandatoryMailTemplate(templateKey)).toBe(false);
    },
  );
});
