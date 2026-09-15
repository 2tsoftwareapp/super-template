import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Guards the public `exports` map of every workspace package: each published subpath has
 * to resolve to a module, and that module has to expose symbols (or be declared type-only
 * just below).
 *
 * The pre-existing guard only checked that the file a subpath points at exists on disk,
 * so a subpath could be renamed to a specifier nothing can import and no test would fail.
 * This spec imports the real specifier instead, which is the property consumers depend on.
 *
 * The specifier is computed at runtime from each `package.json`, and vitest's module
 * runner still applies the `resolve.alias` entries from `vitest.config.ts`. That is why
 * this spec lives in apps/api: that config already resolves the server-side packages the
 * API composition consumes.
 */
const REPO_ROOT = resolve(__dirname, "../../../..");

/**
 * Packages whose subpaths genuinely cannot be loaded in a Node test environment, with the
 * reason each one is out of scope. Exclusions are checked for staleness below, so a name
 * here either matches a workspace package that still publishes `exports`, or the spec
 * fails - nothing is skipped silently.
 */
const UNLOADABLE_PACKAGES: Record<string, string> = {
  "@repo/eslint-config":
    "flat ESLint presets consumed by the ESLint CLI, not importable as runtime modules",
  "@repo/web-hooks": "React client hooks; needs a React renderer plus @tanstack/react-query",
  "@repo/web-server": "Next.js server helpers (next/headers, server-only)",
  "@repo/web-test": "browser test helpers built on react-dom and testing-library",
  "@repo/web-ui": 'React/Next components marked "use client"; require a DOM renderer',
};

/**
 * Subpaths whose public surface is types only. Importing them still has to succeed, but
 * the runtime namespace is legitimately empty: `interface` and `type` declarations do not
 * exist at runtime. The list is asserted to be exact, so it cannot paper over a subpath
 * that broke.
 */
const TYPE_ONLY_SUBPATHS = new Set(["@repo/web-utils/api-types"]);

interface WorkspacePackage {
  name: string;
  exports: Record<string, string>;
}

interface PackageManifest {
  name?: string;
  exports?: unknown;
}

/** Expands the `packages:` globs of pnpm-workspace.yaml into package directories. */
const workspacePackageDirectories = (): string[] => {
  const manifest = readFileSync(join(REPO_ROOT, "pnpm-workspace.yaml"), "utf8");
  const directories: string[] = [];
  let inPackages = false;

  for (const line of manifest.split("\n")) {
    if (inPackages && /^\S/.test(line)) {
      break;
    }
    if (/^packages:/.test(line)) {
      inPackages = true;
      continue;
    }
    if (!inPackages) {
      continue;
    }

    const pattern = /^\s*-\s*"?([^"]+)"?\s*$/.exec(line)?.[1];
    if (!pattern) {
      continue;
    }

    if (!pattern.endsWith("/*")) {
      const directory = join(REPO_ROOT, pattern);
      if (existsSync(join(directory, "package.json"))) {
        directories.push(directory);
      }
      continue;
    }

    const base = join(REPO_ROOT, pattern.slice(0, -2));
    if (!existsSync(base)) {
      continue;
    }
    for (const entry of readdirSync(base)) {
      const directory = join(base, entry);
      if (existsSync(join(directory, "package.json"))) {
        directories.push(directory);
      }
    }
  }

  return directories;
};

/** Workspace packages that publish an `exports` map, i.e. everything with a public API. */
const readWorkspacePackages = (): WorkspacePackage[] => {
  const packages: WorkspacePackage[] = [];

  for (const directory of workspacePackageDirectories()) {
    const manifest = JSON.parse(
      readFileSync(join(directory, "package.json"), "utf8"),
    ) as PackageManifest;

    if (!manifest.name || typeof manifest.exports !== "object" || manifest.exports === null) {
      continue;
    }

    packages.push({
      name: manifest.name,
      exports: manifest.exports as Record<string, string>,
    });
  }

  return packages;
};

/** `"."` is the bare package name; every other key becomes a `/`-joined subpath. */
const toSpecifier = (packageName: string, exportKey: string): string =>
  exportKey === "." ? packageName : `${packageName}/${exportKey.replace(/^\.\//, "")}`;

describe("public package exports", () => {
  it("imports every exports subpath published by the workspace", async () => {
    const packages = readWorkspacePackages();
    expect(packages.length).toBeGreaterThan(0);

    const loadable = packages.filter((entry) => !(entry.name in UNLOADABLE_PACKAGES));
    const excluded = packages.filter((entry) => entry.name in UNLOADABLE_PACKAGES);

    // A stale entry here would hide a package that is in fact loadable, or name a package
    // that no longer publishes exports. Both make the exclusion list lie, so fail on it.
    expect(excluded.map((entry) => entry.name).sort()).toEqual(
      Object.keys(UNLOADABLE_PACKAGES).sort(),
    );
    for (const [name, reason] of Object.entries(UNLOADABLE_PACKAGES)) {
      expect(reason, `${name} is excluded without a documented reason`).not.toHaveLength(0);
    }

    const imported: string[] = [];
    const emptyNamespaces: string[] = [];
    for (const workspacePackage of loadable) {
      for (const exportKey of Object.keys(workspacePackage.exports)) {
        const specifier = toSpecifier(workspacePackage.name, exportKey);
        const module = (await import(specifier)) as Record<string, unknown>;

        if (Object.keys(module).length === 0) {
          emptyNamespaces.push(specifier);
        }
        imported.push(specifier);
      }
    }

    // `toEqual` on the sorted lists checks both directions: a subpath that resolves to an
    // empty namespace without being declared type-only fails, and so does a declared
    // entry that gained runtime exports (the declaration would then be stale).
    expect(
      emptyNamespaces.sort(),
      "subpaths that resolve but expose nothing at runtime, versus the declared type-only list",
    ).toEqual([...TYPE_ONLY_SUBPATHS].sort());

    // Coverage: every published subpath is either imported above or listed in
    // UNLOADABLE_PACKAGES - the two sets together must account for the whole map.
    const published = packages.flatMap((entry) =>
      Object.keys(entry.exports).map((key) => toSpecifier(entry.name, key)),
    );
    const excludedSubpaths = excluded.flatMap((entry) =>
      Object.keys(entry.exports).map((key) => toSpecifier(entry.name, key)),
    );

    expect(imported.length).toBeGreaterThan(0);
    expect(imported.length + excludedSubpaths.length).toBe(published.length);
    expect(new Set(imported).size).toBe(imported.length);

    console.log(
      [
        "",
        `[public-api-exports] packages with an exports map: ${packages.length}`,
        `[public-api-exports] subpaths imported: ${imported.length}`,
        `[public-api-exports] subpaths excluded by policy: ${excludedSubpaths.length} (${excluded.length} packages)`,
        `[public-api-exports] excluded packages: ${excluded
          .map((entry) => entry.name)
          .sort()
          .join(", ")}`,
        `[public-api-exports] imported packages: ${loadable.map((entry) => entry.name).join(", ")}`,
        "",
      ].join("\n"),
    );
  });
});
