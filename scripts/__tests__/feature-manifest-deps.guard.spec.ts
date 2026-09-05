import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

const scriptPath = resolve(dirname(fileURLToPath(import.meta.url)), "..", "check-feature-manifest-deps.mjs");

interface FixturePackage {
  name: string;
  manifestFile?: string;
  manifestId?: string;
  dependsOn?: string[];
  /** feature package dependencies (name -> version). */
  featureDependencies?: Record<string, string>;
  sourceFiles?: Record<string, string>;
  extraExports?: Record<string, string>;
}

interface FixtureOptions {
  packages: Record<string, FixturePackage>;
}

const tempDirs: string[] = [];
function makeFixture(options: FixtureOptions): string {
  const base = mkdtempSync(join(tmpdir(), "manifest-deps-guard-"));
  tempDirs.push(base);
  const packagesRoot = join(base, "packages");
  mkdirSync(packagesRoot, { recursive: true });

  for (const [dir, pkg] of Object.entries(options.packages)) {
    const packageDir = join(packagesRoot, dir);
    mkdirSync(join(packageDir, "src"), { recursive: true });
    const exports: Record<string, string> = { ".": pkg.manifestFile ? `./src/${pkg.manifestFile}` : "./src/index.ts" };
    if (pkg.extraExports) Object.assign(exports, pkg.extraExports);
    const packageJson: Record<string, unknown> = {
      name: pkg.name,
      version: "1.0.0",
      private: true,
      exports,
    };
    if (pkg.featureDependencies && Object.keys(pkg.featureDependencies).length > 0) {
      packageJson.dependencies = pkg.featureDependencies;
    }
    writeFileSync(join(packageDir, "package.json"), JSON.stringify(packageJson, null, 2));
    writeFileSync(join(packageDir, "src", "index.ts"), "export {};\n");
    if (pkg.manifestFile) {
      const dependsOn = (pkg.dependsOn ?? [])
        .map((id) => `"${id}"`)
        .join(", ");
      writeFileSync(
        join(packageDir, "src", pkg.manifestFile),
        [
          `import { defineFeature } from "@repo/api-plugin-kit";`,
          `export const featureManifest = defineFeature({ id: "${pkg.manifestId}", dependsOn: [${dependsOn}] });`,
          "",
        ].join("\n"),
      );
    }
    for (const [file, content] of Object.entries(pkg.sourceFiles ?? {})) {
      const target = join(packageDir, "src", file);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, content);
    }
  }
  return base;
}

function runGuard(fixtureRoot: string): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(process.execPath, [scriptPath], { cwd: fixtureRoot, encoding: "utf8" });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("check-feature-manifest-deps guard (full-package scan)", () => {
  it("passes when every cross-feature import is declared in dependsOn + package.json dependencies", () => {
    const root = makeFixture({
      packages: {
        "feature-base": {
          name: "@repo/feature-base",
          manifestFile: "base.feature.ts",
          manifestId: "base",
          extraExports: { "./contracts": "./src/public/contracts.ts" },
          sourceFiles: { "public/contracts.ts": `export const BASE_TOKEN = "base";\n` },
        },
        "feature-consumer": {
          name: "@repo/feature-consumer",
          manifestFile: "consumer.feature.ts",
          manifestId: "consumer",
          dependsOn: ["base"],
          featureDependencies: { "@repo/feature-base": "workspace:*" },
          sourceFiles: {
            "application/service.ts": `import { BASE_TOKEN } from "@repo/feature-base/contracts";\nexport const x = BASE_TOKEN;\n`,
          },
          extraExports: { "./contracts": "./src/public/contracts.ts" },
        },
      },
    });

    const result = runGuard(root);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("all source files scanned");
  });

  it("fails when a non-manifest source file imports a feature not present in dependsOn", () => {
    const root = makeFixture({
      packages: {
        "feature-base": { name: "@repo/feature-base", manifestFile: "base.feature.ts", manifestId: "base" },
        "feature-consumer": {
          name: "@repo/feature-consumer",
          manifestFile: "consumer.feature.ts",
          manifestId: "consumer",
          featureDependencies: { "@repo/feature-base": "workspace:*" },
          // NOTE: no dependsOn entry for base
          sourceFiles: {
            "application/service.ts": `import { BASE_TOKEN } from "@repo/feature-base/contracts";\nexport const x = BASE_TOKEN;\n`,
          },
          extraExports: { "./contracts": "./src/public/contracts.ts" },
        },
      },
    });

    const result = runGuard(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('feature "base" not in dependsOn');
  });

  it("fails on undeclared package.json dependencies even when dependsOn lists the feature", () => {
    const root = makeFixture({
      packages: {
        "feature-base": { name: "@repo/feature-base", manifestFile: "base.feature.ts", manifestId: "base" },
        "feature-consumer": {
          name: "@repo/feature-consumer",
          manifestFile: "consumer.feature.ts",
          manifestId: "consumer",
          dependsOn: ["base"],
          // NOTE: no package.json dependency on feature-base
          sourceFiles: {
            "application/service.ts": `import { BASE_TOKEN } from "@repo/feature-base/contracts";\nexport const x = BASE_TOKEN;\n`,
          },
          extraExports: { "./contracts": "./src/public/contracts.ts" },
        },
      },
    });

    const result = runGuard(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("missing from package.json dependencies");
  });

  it("fails on deep imports that bypass documented subpath exports", () => {
    const root = makeFixture({
      packages: {
        "feature-base": { name: "@repo/feature-base", manifestFile: "base.feature.ts", manifestId: "base" },
        "feature-consumer": {
          name: "@repo/feature-consumer",
          manifestFile: "consumer.feature.ts",
          manifestId: "consumer",
          dependsOn: ["base"],
          featureDependencies: { "@repo/feature-base": "workspace:*" },
          sourceFiles: {
            "application/service.ts": `import { BASE_TOKEN } from "@repo/feature-base/infrastructure/internal";\nexport const x = BASE_TOKEN;\n`,
          },
        },
      },
    });

    const result = runGuard(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("not a declared subpath export");
  });

  it("fails when a source file imports a feature package that has no validated manifest", () => {
    const root = makeFixture({
      packages: {
        "feature-consumer": {
          name: "@repo/feature-consumer",
          manifestFile: "consumer.feature.ts",
          manifestId: "consumer",
          featureDependencies: { "@repo/feature-ghost": "workspace:*" },
          sourceFiles: {
            "application/service.ts": `import { X } from "@repo/feature-ghost/contracts";\nexport const x = X;\n`,
          },
        },
        "feature-ghost": { name: "@repo/feature-ghost" },
      },
    });

    const result = runGuard(root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("no exported defineFeature manifest discovered");
  });
});
