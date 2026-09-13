#!/usr/bin/env node
import assert from "node:assert/strict";
import { after, test } from "node:test";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { buildFeatureChoices, selectFeaturesInteractively } from "../create-project.mjs";
import { discoverFeatureCatalog, resolveFeatureSelection } from "../lib/feature-catalog.mjs";

const repoRoot = resolve(import.meta.dirname, "../..");
const generator = join(repoRoot, "scripts/create-project.mjs");
const temporaryRoots = [];

function makeTemporaryRoot(label) {
  const root = join(tmpdir(), `super-template-${label}-${process.pid}-${Date.now()}`);
  mkdirSync(root, { recursive: true });
  temporaryRoots.push(root);
  return root;
}

function runGenerator(args) {
  return spawnSync(process.execPath, [generator, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
  });
}

function registryFeatureIds(target) {
  return readFileSync(join(target, "packages/app-composition/src/feature-registry.ts"), "utf8")
    .split("\n")
    .map((line) => line.match(/from "@repo\/feature-([^"]+)"/)?.[1])
    .filter(Boolean);
}

after(() => {
  for (const root of temporaryRoots) rmSync(root, { recursive: true, force: true });
});

test("help exposes the project generator contract", () => {
  const result = runGenerator(["--help"]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /--features <ids>/);
  assert.match(result.stdout, /select interactively/);
  assert.match(result.stdout, /--target <dir>/);
  assert.match(result.stdout, /--dry-run/);
  assert.match(result.stdout, /--check/);
});

test("interactive selector lists discovered packages and returns selected IDs", async () => {
  const catalog = discoverFeatureCatalog(repoRoot);
  let promptConfig;
  const selected = await selectFeaturesInteractively(catalog, async (config) => {
    promptConfig = config;
    return ["auth"];
  });

  assert.deepEqual(selected, ["auth"]);
  assert.deepEqual(
    promptConfig.choices.map((choice) => choice.value),
    catalog.features.map((feature) => feature.id),
  );
  assert.equal(promptConfig.choices.length, 25);
  assert.match(
    buildFeatureChoices(catalog).find((choice) => choice.value === "auth").description,
    /requires:/,
  );
  assert.match(
    buildFeatureChoices(catalog).find((choice) => choice.value === "database-read-replica")
      .description,
    /eventual reads via replica/,
  );
  assert.ok(resolveFeatureSelection(catalog, selected).resolvedIds.includes("users"));
});

test("catalog exposes infrastructure capability metadata and rejects conflicting tenant variants", () => {
  const catalog = discoverFeatureCatalog(repoRoot);
  assert.deepEqual(catalog.byId.get("tenant-schema").capability, {
    family: "tenant-isolation",
    variant: "schema-per-tenant",
    conflictsWith: ["tenant-shared-schema"],
  });
  assert.deepEqual(catalog.byId.get("database-read-replica").database, {
    readReplica: true,
    readConsistency: "eventual",
  });
  assert.deepEqual(catalog.byId.get("org-model-optional").organizationModel, {
    organizationModel: "org-optional",
  });
  assert.deepEqual(catalog.byId.get("org-model-personal-orgs").organizationModel, {
    organizationModel: "personal-orgs",
  });
  assert.throws(
    () =>
      resolveFeatureSelection(catalog, ["org-model-optional", "org-model-personal-orgs"]),
    /Conflicting feature capabilities.*org-model-optional.*org-model-personal-orgs/,
  );
  assert.equal(
    resolveFeatureSelection(catalog, ["org-model-optional"]).organizationModel.organizationModel,
    "org-optional",
  );

  assert.throws(
    () => resolveFeatureSelection(catalog, ["tenant-shared-schema", "tenant-schema"]),
    /Conflicting feature capabilities.*tenant-shared-schema.*tenant-schema/,
  );
  assert.deepEqual(
    resolveFeatureSelection(catalog, ["tenant-schema", "database-read-replica"]).resolvedIds,
    ["database-read-replica", "tenant-schema"],
  );
});

test("auth generation resolves dependencies and keeps API wiring consistent", () => {
  const target = join(makeTemporaryRoot("auth"), "project");
  const result = runGenerator(["--features", "auth", "--target", target, "--skip-install"]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(existsSync(join(target, ".git")), false);
  assert.equal(existsSync(join(target, "node_modules")), false);
  assert.equal(existsSync(join(target, ".agent-work")), false);

  const profile = JSON.parse(readFileSync(join(target, "feature-profile.json"), "utf8"));
  const packageJson = JSON.parse(readFileSync(join(target, "apps/api/package.json"), "utf8"));
  const compositionPackageJson = JSON.parse(
    readFileSync(join(target, "packages/app-composition/package.json"), "utf8"),
  );
  const packageFeatureIds = Object.keys(packageJson.dependencies)
    .filter((name) => name.startsWith("@repo/feature-"))
    .map((name) => name.slice("@repo/feature-".length));

  assert.deepEqual(profile.requestedFeatures, ["auth"]);
  assert.equal(profile.resolvedFeatures.at(-1), "auth");
  assert.ok(profile.resolvedFeatures.length > profile.requestedFeatures.length);
  assert.deepEqual(packageFeatureIds, profile.resolvedFeatures);
  assert.deepEqual(
    Object.keys(compositionPackageJson.dependencies)
      .filter((name) => name.startsWith("@repo/feature-"))
      .map((name) => name.slice("@repo/feature-".length)),
    profile.resolvedFeatures,
  );
  assert.deepEqual(registryFeatureIds(target), profile.resolvedFeatures);

  const check = runGenerator([
    "--features",
    "auth",
    "--target",
    target,
    "--check",
    "--skip-install",
  ]);
  assert.equal(check.status, 0, check.stderr);

  const registry = join(target, "packages/app-composition/src/feature-registry.ts");
  writeFileSync(registry, `${readFileSync(registry, "utf8")}// deliberate drift\n`);
  const drift = runGenerator([
    "--features",
    "auth",
    "--target",
    target,
    "--check",
    "--skip-install",
  ]);
  assert.notEqual(drift.status, 0);
  assert.match(drift.stderr, /Generated target is out of date/);
});

test("representative feature selections produce matching package and registry sets", () => {
  const root = makeTemporaryRoot("profiles");
  for (const id of ["health", "auth", "import-export", "notifications"]) {
    const target = join(root, id);
    const result = runGenerator(["--features", id, "--target", target, "--skip-install"]);
    assert.equal(result.status, 0, `${id}: ${result.stderr}`);

    const profile = JSON.parse(readFileSync(join(target, "feature-profile.json"), "utf8"));
    const packageJson = JSON.parse(readFileSync(join(target, "apps/api/package.json"), "utf8"));
    const compositionPackageJson = JSON.parse(
      readFileSync(join(target, "packages/app-composition/package.json"), "utf8"),
    );
    const packageFeatureIds = Object.keys(packageJson.dependencies)
      .filter((name) => name.startsWith("@repo/feature-"))
      .map((name) => name.slice("@repo/feature-".length));

    assert.deepEqual(packageFeatureIds, profile.resolvedFeatures, id);
    assert.deepEqual(
      Object.keys(compositionPackageJson.dependencies)
        .filter((name) => name.startsWith("@repo/feature-"))
        .map((name) => name.slice("@repo/feature-".length)),
      profile.resolvedFeatures,
      id,
    );
    assert.deepEqual(registryFeatureIds(target), profile.resolvedFeatures, id);
  }
});

test("capability aliases generate a reproducible tenant and replica profile", () => {
  const target = join(makeTemporaryRoot("capability-aliases"), "project");
  const result = runGenerator([
    "--features",
    "health",
    "--tenant-mode",
    "schema-per-tenant",
    "--read-replica",
    "--target",
    target,
    "--skip-install",
  ]);

  assert.equal(result.status, 0, result.stderr);
  const profile = JSON.parse(readFileSync(join(target, "feature-profile.json"), "utf8"));
  assert.deepEqual(profile.capabilities, {
    selected: ["database-read-replica", "tenant-schema"],
    tenantMode: "schema-per-tenant",
    readReplica: true,
    readConsistency: "eventual",
    organizationModel: "personal-orgs",
  });
  assert.ok(profile.resolvedFeatures.includes("tenant-schema"));
  assert.ok(profile.resolvedFeatures.includes("database-read-replica"));
  assert.deepEqual(registryFeatureIds(target), profile.resolvedFeatures);
});

test("existing generated targets use immutable feature selection", () => {
  const root = makeTemporaryRoot("immutable-selection");
  const broadTarget = join(root, "broad");
  const broad = runGenerator(["--features", "auth", "--target", broadTarget, "--skip-install"]);
  assert.equal(broad.status, 0, broad.stderr);
  const userFile = join(broadTarget, "README.user.md");
  writeFileSync(userFile, "keep this user-owned file\n");

  const broadToNarrow = runGenerator([
    "--features",
    "health",
    "--target",
    broadTarget,
    "--skip-install",
  ]);
  assert.notEqual(broadToNarrow.status, 0);
  assert.match(broadToNarrow.stderr, /immutable feature selection/);
  assert.equal(readFileSync(userFile, "utf8"), "keep this user-owned file\n");

  const narrowTarget = join(root, "narrow");
  const narrow = runGenerator(["--features", "health", "--target", narrowTarget, "--skip-install"]);
  assert.equal(narrow.status, 0, narrow.stderr);
  const narrowToBroad = runGenerator([
    "--features",
    "auth",
    "--target",
    narrowTarget,
    "--check",
    "--skip-install",
  ]);
  assert.notEqual(narrowToBroad.status, 0);
  assert.match(narrowToBroad.stderr, /immutable feature selection/);

  // A different request that resolves to the same closure must still be rejected:
  // feature-profile.json records the request as well as the closure, so accepting
  // it would rewrite the profile and break the immutability guarantee.
  const sameClosureTarget = join(root, "same-closure");
  const sameClosure = runGenerator([
    "--features",
    "auth",
    "--target",
    sameClosureTarget,
    "--skip-install",
  ]);
  assert.equal(sameClosure.status, 0, sameClosure.stderr);

  const sameClosureRerun = runGenerator([
    "--features",
    "auth,users",
    "--target",
    sameClosureTarget,
    "--skip-install",
  ]);
  assert.notEqual(sameClosureRerun.status, 0);
  assert.match(sameClosureRerun.stderr, /immutable feature selection/);
});

test("dry-run and invalid selections do not create or mutate targets", () => {
  const root = makeTemporaryRoot("guards");
  const dryTarget = join(root, "dry-run");
  const dryRun = runGenerator([
    "--features",
    "auth",
    "--target",
    dryTarget,
    "--dry-run",
    "--skip-install",
  ]);
  assert.equal(dryRun.status, 0, dryRun.stderr);
  assert.equal(existsSync(dryTarget), false);
  assert.match(dryRun.stdout, /Auto-added dependencies:/);
  assert.match(dryRun.stdout, /Would write: packages\/app-composition\/src\/feature-registry\.ts/);

  const missingTarget = join(root, "missing-features");
  const missing = runGenerator(["--target", missingTarget, "--skip-install"]);
  assert.notEqual(missing.status, 0);
  assert.equal(existsSync(missingTarget), false);
  assert.match(missing.stderr, /interactive terminal/);
  assert.match(missing.stderr, /--features <ids>/);

  const invalidTarget = join(root, "invalid");
  const invalid = runGenerator([
    "--features",
    "does-not-exist",
    "--target",
    invalidTarget,
    "--skip-install",
  ]);
  assert.notEqual(invalid.status, 0);
  assert.equal(existsSync(invalidTarget), false);
  assert.match(invalid.stderr, /Unknown feature/);

  const conflictingAliasTarget = join(root, "conflicting-alias");
  const conflictingAlias = runGenerator([
    "--features",
    "tenant-shared-schema",
    "--tenant-mode",
    "schema-per-tenant",
    "--target",
    conflictingAliasTarget,
    "--skip-install",
  ]);
  assert.notEqual(conflictingAlias.status, 0);
  assert.equal(existsSync(conflictingAliasTarget), false);
  assert.match(conflictingAlias.stderr, /Conflicting feature capabilities|conflicts with selected/);

  const duplicateTarget = join(root, "duplicate");
  const duplicate = runGenerator([
    "--features",
    "health,health",
    "--target",
    duplicateTarget,
    "--skip-install",
  ]);
  assert.notEqual(duplicate.status, 0);
  assert.equal(existsSync(duplicateTarget), false);
  assert.match(duplicate.stderr, /selected more than once/);

  const nonEmpty = join(root, "non-empty");
  mkdirSync(nonEmpty, { recursive: true });
  writeFileSync(join(nonEmpty, "marker"), "keep");
  const refused = runGenerator(["--features", "health", "--target", nonEmpty, "--skip-install"]);
  assert.notEqual(refused.status, 0);
  assert.match(refused.stderr, /Refusing to mutate non-empty target/);
  assert.equal(readFileSync(join(nonEmpty, "marker"), "utf8"), "keep");

  const unsafeLink = join(root, "source-link");
  symlinkSync(repoRoot, unsafeLink, "dir");
  const symlinkTarget = runGenerator([
    "--features",
    "health",
    "--target",
    unsafeLink,
    "--skip-install",
  ]);
  assert.notEqual(symlinkTarget.status, 0);
  assert.match(symlinkTarget.stderr, /Source and target must be different/);
});

test("dependency cycles are rejected with the offending edge", () => {
  const feature = (id, dependsOn) => ({
    id,
    packageName: `@repo/feature-${id}`,
    packageDir: "/tmp",
    manifestFile: "/tmp/index.ts",
    manifestExport: `${id}Feature`,
    dependsOn,
    packageJson: {},
  });
  const features = [feature("alpha", ["beta"]), feature("beta", ["alpha"])];
  const catalog = {
    features,
    byId: new Map(features.map((item) => [item.id, item])),
    inputOrder: new Map([
      ["alpha", 0],
      ["beta", 1],
    ]),
  };

  assert.throws(
    () => resolveFeatureSelection(catalog, ["alpha"]),
    /Feature dependency cycle detected: alpha -> beta -> alpha/,
  );
});

test("unsupported surfaces fail before target creation", () => {
  const target = join(makeTemporaryRoot("surface"), "project");
  const result = runGenerator([
    "--features",
    "health",
    "--surfaces",
    "api,web",
    "--target",
    target,
    "--skip-install",
  ]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Surface "web" is not supported/);
  assert.equal(existsSync(target), false);
});

test("scaffold fixture uses the canonical plugin kit and registry path", () => {
  const fixture = makeTemporaryRoot("scaffold");
  const fixtureScripts = join(fixture, "scripts");
  mkdirSync(fixtureScripts, { recursive: true });
  copyFileSync(
    join(repoRoot, "scripts/scaffold-feature.mjs"),
    join(fixtureScripts, "scaffold-feature.mjs"),
  );

  const result = spawnSync(
    process.execPath,
    [join(fixtureScripts, "scaffold-feature.mjs"), "billing"],
    {
      cwd: fixture,
      encoding: "utf8",
    },
  );
  assert.equal(result.status, 0, result.stderr);

  const featureRoot = join(fixture, "packages/feature-billing");
  const packageJson = JSON.parse(readFileSync(join(featureRoot, "package.json"), "utf8"));
  const manifest = readFileSync(join(featureRoot, "src/billing.feature.ts"), "utf8");
  const index = readFileSync(join(featureRoot, "src/index.ts"), "utf8");
  const readme = readFileSync(join(featureRoot, "README.md"), "utf8");
  assert.equal(packageJson.dependencies["@repo/api-plugin-kit"], "workspace:*");
  assert.equal(packageJson.dependencies["@repo/api-runtime"], undefined);
  assert.match(manifest, /defineFeature[\s\S]*from "@repo\/api-plugin-kit"/);
  assert.match(index, /export \{ billingFeature \}/);
  for (const [name, content] of Object.entries({ manifest, index, readme })) {
    assert.doesNotMatch(
      content,
      /apps\/api\/src\/features\.ts/,
      `${name} references the legacy registry`,
    );
  }
});
