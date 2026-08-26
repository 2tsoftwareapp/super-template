import { composeFeatures } from "@repo/api-plugin-kit";
import { enabledFeatures } from "../../src/composition/feature-registry";
import { describe, expect, it } from "vitest";

describe("feature composition (compile-time plugins)", () => {
  it("composes the real enabled feature registry without duplicate ids/schema keys", () => {
    const composed = composeFeatures(enabledFeatures);

    expect(composed.features.length).toBe(enabledFeatures.length);
    expect(composed.modules.length).toBe(enabledFeatures.length);
    expect(typeof composed.schema).toBe("object");

    const ids = composed.features.map((feature) => feature.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("rejects duplicate feature ids", () => {
    const [first] = enabledFeatures;
    expect(first).toBeTruthy();
    expect(() => composeFeatures([first!, first!])).toThrow(/Duplicate feature id/);
  });

  it("dropping an optional plugin drops exactly its module (omit-plugin smoke)", () => {
    const withAll = composeFeatures(enabledFeatures);
    const withoutHealth = composeFeatures(
      enabledFeatures.filter((feature) => feature.id !== "health"),
    );

    expect(withAll.modules.length - withoutHealth.modules.length).toBe(1);
    expect(withoutHealth.features.some((feature) => feature.id === "health")).toBe(false);
  });

  it("rejects missing dependencies", () => {
    const orphan = {
      id: "needs-auth",
      dependsOn: ["auth"],
      nestModule: class OrphanModule {},
    };
    expect(() => composeFeatures([orphan])).toThrow(/missing feature "auth"/);
  });

  it("rejects dependency cycles", () => {
    const a = {
      id: "a",
      dependsOn: ["b"],
      nestModule: class A {},
    };
    const b = {
      id: "b",
      dependsOn: ["a"],
      nestModule: class B {},
    };
    expect(() => composeFeatures([a, b])).toThrow(/cycle/i);
  });
});
