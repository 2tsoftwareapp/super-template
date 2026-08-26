import { collectFeatureModules, composeFeatureSchemas } from "@repo/api-core";
import { healthFeature } from "@repo/api-health";
import { identityFeature } from "@repo/feature-identity";
import { platformFeature } from "@repo/feature-platform";
import { describe, expect, it } from "vitest";

// Smoke test for the compile-time plugin composition: it exercises the REAL
// feature manifests exported by each `@repo/feature-*` package (not fixtures),
// proving they are valid and that enabling/disabling a plugin is a pure,
// data-driven edit to the manifest list — the guarantee `apps/api/src/features.ts`
// relies on.
describe("feature composition (compile-time plugins)", () => {
  const allFeatures = [identityFeature, platformFeature, healthFeature];

  it("every feature package exports a valid manifest", () => {
    for (const feature of allFeatures) {
      expect(typeof feature.id).toBe("string");
      expect(feature.id.length).toBeGreaterThan(0);
      expect(feature.nestModule).toBeTruthy();
    }
    expect(allFeatures.map((feature) => feature.id)).toEqual(["identity", "platform", "health"]);
  });

  it("dropping a plugin from the list drops exactly its module (omit-plugin smoke)", () => {
    const withHealth = collectFeatureModules(allFeatures);
    const withoutHealth = collectFeatureModules(
      allFeatures.filter((feature) => feature.id !== "health"),
    );

    expect(withHealth).toContain(healthFeature.nestModule);
    expect(withoutHealth).not.toContain(healthFeature.nestModule);
    expect(withHealth.length - withoutHealth.length).toBe(1);
  });

  it("composeFeatureSchemas merges feature schemas without throwing", () => {
    const schema = composeFeatureSchemas(allFeatures);
    expect(typeof schema).toBe("object");
    expect(schema).not.toBeNull();
  });
});
