#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { after, test } from "node:test";
import { discoverFeatureCatalog } from "../lib/feature-catalog.mjs";
import { formatGhostDependencyErrors, findGhostDependencies } from "../lib/ghost-dependencies.mjs";

const repoRoot = resolve(import.meta.dirname, "../..");
const temporaryRoots = [];

function makeFeatureFixture(label, files) {
  const root = join(tmpdir(), `ghost-deps-${label}-${process.pid}-${Date.now()}`);
  mkdirSync(join(root, "src"), { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(root, "src", name), content);
  }
  temporaryRoots.push(root);
  return root;
}

after(() => {
  for (const root of temporaryRoots) rmSync(root, { recursive: true, force: true });
});

function featureFixture(id, packageDir, dependsOn) {
  return {
    id,
    packageName: `@repo/feature-${id}`,
    packageDir,
    dependsOn,
  };
}

function byIdFixture(...features) {
  return new Map(
    features.map((feature) => [feature.id, { id: feature.id, packageName: feature.packageName }]),
  );
}

test("edges with at least one cross-feature import are not ghosts", () => {
  const consumerDir = makeFeatureFixture("clean", {
    "use-case.ts": 'import { AUDIT_WRITER } from "@repo/feature-audit/contracts";\nexport {};\n',
  });
  const features = [
    featureFixture("audit", "/tmp/audit", []),
    featureFixture("consumer", consumerDir, ["audit"]),
  ];
  const ghosts = findGhostDependencies(features, byIdFixture(...features));
  assert.deepEqual(ghosts, []);
});

test("edges without any import of the dependency package are ghosts", () => {
  const consumerDir = makeFeatureFixture("ghost", {
    "use-case.ts": 'import { AUDIT_WRITER } from "@repo/feature-audit/contracts";\nexport {};\n',
  });
  const features = [
    featureFixture("audit", "/tmp/audit", []),
    featureFixture("mail", "/tmp/mail", []),
    featureFixture("consumer", consumerDir, ["audit", "mail"]),
  ];
  const ghosts = findGhostDependencies(features, byIdFixture(...features));
  assert.deepEqual(ghosts, [
    { featureId: "consumer", dependencyId: "mail", packageName: "@repo/feature-mail" },
  ]);
  assert.match(
    formatGhostDependencyErrors(ghosts)[0],
    /declares dependsOn "mail" but never imports @repo\/feature-mail/,
  );
});

test("self-imports and subpath imports of the own package are ignored", () => {
  const consumerDir = makeFeatureFixture("self", {
    "index.ts": 'export { AUTH_ERROR_CODES } from "@repo/feature-consumer/contracts";\n',
  });
  const features = [featureFixture("consumer", consumerDir, [])];
  const ghosts = findGhostDependencies(features, byIdFixture(...features));
  assert.deepEqual(ghosts, []);
});

test("test-support directories are skipped by the scan", () => {
  const consumerDir = makeFeatureFixture("tests", { "use-case.ts": "export {};\n" });
  mkdirSync(join(consumerDir, "src", "__tests__"), { recursive: true });
  writeFileSync(
    join(consumerDir, "src", "__tests__", "stub.ts"),
    'import { MAIL_SENDER } from "@repo/feature-mail/testing";\nexport {};\n',
  );
  const features = [
    featureFixture("mail", "/tmp/mail", []),
    featureFixture("consumer", consumerDir, ["mail"]),
  ];
  const ghosts = findGhostDependencies(features, byIdFixture(...features));
  assert.deepEqual(ghosts, [
    { featureId: "consumer", dependencyId: "mail", packageName: "@repo/feature-mail" },
  ]);
});

test("discoverFeatureCatalog rejects ghost edges with the offending package", () => {
  const root = join(tmpdir(), `ghost-repo-${process.pid}-${Date.now()}`);
  temporaryRoots.push(root);

  const manifest = (
    id,
    exportName,
    dependsOn,
  ) => `import { defineFeature } from "@repo/api-plugin-kit";

export const ${exportName} = defineFeature({
  id: "${id}",
  dependsOn: ${JSON.stringify(dependsOn)},
});
`;

  for (const [id, exportName, dependsOn] of [
    ["alpha", "alphaFeature", []],
    ["beta", "betaFeature", ["alpha"]],
  ]) {
    const packageDir = join(root, "packages", `feature-${id}`);
    mkdirSync(join(packageDir, "src"), { recursive: true });
    writeFileSync(join(packageDir, "src", `${id}.feature.ts`), manifest(id, exportName, dependsOn));
    writeFileSync(
      join(packageDir, "package.json"),
      `${JSON.stringify({ name: `@repo/feature-${id}`, version: "1.0.0", private: true }, null, 2)}\n`,
    );
  }

  assert.throws(
    () => discoverFeatureCatalog(root),
    /feature "beta" declares dependsOn "alpha" but never imports @repo\/feature-alpha/,
  );
});

test("the real catalog has no ghost dependencies", () => {
  // discoverFeatureCatalog throws on ghosts; reaching a catalog here proves zero ghosts.
  const catalog = discoverFeatureCatalog(repoRoot);
  assert.equal(catalog.ghostDependencies.length, 0);
});
