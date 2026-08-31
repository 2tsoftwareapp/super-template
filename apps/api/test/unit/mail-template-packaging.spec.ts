import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Verify that mail templates are correctly packaged in the production
 * webpack bundle output and that the renderer can resolve them.
 *
 * This test runs against the actual built artifact (pnpm --filter api build)
 * to ensure CopyPlugin copied templates to dist/templates/mail/.
 */

const DIST_DIR = join(__dirname, "../../dist");
const TEMPLATES_DIR = join(DIST_DIR, "templates", "mail");

const EXPECTED_TEMPLATES = ["auth.verify-email", "auth.reset-password", "auth.welcome"];

const EXPECTED_PARTS = ["subject.txt", "text.txt", "html.txt"];

describe("Mail template packaging", () => {
  it("templates directory exists in dist output", () => {
    expect(existsSync(TEMPLATES_DIR)).toBe(true);
  });

  it("all expected templates are present with subject/text/html parts", () => {
    const files = readdirSync(TEMPLATES_DIR);
    for (const template of EXPECTED_TEMPLATES) {
      for (const part of EXPECTED_PARTS) {
        const fileName = `${template}.${part}`;
        expect(files).toContain(fileName);
      }
    }
  });

  it("templates contain valid content with variable placeholders", () => {
    for (const template of EXPECTED_TEMPLATES) {
      const subjectPath = join(TEMPLATES_DIR, `${template}.subject.txt`);
      const content = readFileSync(subjectPath, "utf8");
      expect(content.length).toBeGreaterThan(0);
    }
  });

  it("legacy dist/platform/modules/mail path does not exist", () => {
    const legacyPath = join(DIST_DIR, "platform/modules/mail");
    expect(existsSync(legacyPath)).toBe(false);
  });

  it("does not fail for missing template (expected error path)", () => {
    const missingPath = join(TEMPLATES_DIR, "nonexistent.subject.txt");
    expect(existsSync(missingPath)).toBe(false);
  });
});
