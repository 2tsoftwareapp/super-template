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
    expect(() => composeFeatures([first!, first!])).toThrow(
      /(Duplicate feature id|is provided by both)/,
    );
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

  it("omitting auth (and its dependents) drops auth schema; users stays free of feature-auth imports", async () => {
    // Drop auth and every feature that lists it in dependsOn (upload, sso, …).
    const withoutAuthIds = new Set(["auth"]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const feature of enabledFeatures) {
        if (withoutAuthIds.has(feature.id)) continue;
        if ((feature.dependsOn ?? []).some((dep) => withoutAuthIds.has(dep))) {
          withoutAuthIds.add(feature.id);
          changed = true;
        }
      }
    }
    const withoutAuthTree = composeFeatures(
      enabledFeatures.filter((feature) => !withoutAuthIds.has(feature.id)),
    );
    expect(withoutAuthTree.features.some((feature) => feature.id === "auth")).toBe(false);
    expect(withoutAuthTree.schema).not.toHaveProperty("authSessions");
    expect(withoutAuthTree.schema).toHaveProperty("users");

    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const usersRoot = path.resolve(__dirname, "../../../../packages/feature-users/src");
    const stack = [usersRoot];
    const offenders: string[] = [];
    while (stack.length) {
      const dir = stack.pop()!;
      for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          stack.push(full);
          continue;
        }
        if (!entry.name.endsWith(".ts")) continue;
        const text = await fs.readFile(full, "utf8");
        if (text.includes("@repo/feature-auth")) {
          offenders.push(path.relative(usersRoot, full));
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("omitting health drops its module even when it contributes no schema tables", () => {
    const withAll = composeFeatures(enabledFeatures);
    const withoutHealth = composeFeatures(
      enabledFeatures.filter((feature) => feature.id !== "health"),
    );
    expect(withAll.modules.length - withoutHealth.modules.length).toBe(1);
    expect(withoutHealth.features.some((feature) => feature.id === "health")).toBe(false);
  });

  it("composes authorization resources from feature manifests", () => {
    const composed = composeFeatures(enabledFeatures);
    expect(composed.authorization.resources.users?.scope).toBe("organization");
    expect(composed.authorization.resources.audit?.scope).toBe("platform");
    expect(composed.authorization.resources.files?.scope).toBe("organization");
  });
});
