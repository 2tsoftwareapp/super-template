#!/usr/bin/env node
/**
 * Generate (and verify) the `README.md` of every `packages/feature-*` package.
 *
 * The feature dependency list in a README is a claim about
 * `package.json` (`@repo/feature-*` dependencies, which
 * `scripts/check-feature-manifest-deps.mjs` keeps in sync with the manifest's
 * `dependsOn`). Hand-maintained copies drift silently, so the list is generated
 * from the manifest instead:
 *
 *   node scripts/generate-feature-readmes.mjs           # create missing, refresh stale
 *   node scripts/generate-feature-readmes.mjs --check   # non-mutating; exit 1 on drift
 *
 * Ownership rule: a README that contains the generated
 * "## Feature dependencies" section is owned by this script and is rewritten
 * whenever the generated content drifts. A README without that section is
 * hand-written (or produced by `scripts/scaffold-feature.mjs`, whose README
 * documents the plugin contract and layout) and is never overwritten — it is
 * reported as skipped so the gap is visible instead of silently "green".
 * A feature package with no README at all is a failure in `--check`.
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const checkOnly = args.has("--check");
const dryRun = args.has("--dry-run");
const MANAGED_SECTION = "## Feature dependencies";
const code = (value) => `\`${value}\``;

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function featurePackages() {
  const packagesRoot = path.join(root, "packages");
  return fs
    .readdirSync(packagesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("feature-"))
    .map((entry) => path.join(packagesRoot, entry.name))
    .filter((directory) => fs.existsSync(path.join(directory, "package.json")))
    .sort();
}

function renderReadme(directory) {
  const manifest = readJson(path.join(directory, "package.json"));
  const sourceDirectory = path.join(directory, "src");
  const featureFile = fs.readdirSync(sourceDirectory).find((file) => file.endsWith(".feature.ts"));
  const featureSource = featureFile
    ? fs.readFileSync(path.join(sourceDirectory, featureFile), "utf8")
    : "";
  const featureId =
    featureSource.match(/id:\s*["']([^"']+)["']/)?.[1] ??
    manifest.name.replace(/^@repo\/feature-/, "");
  const dependencies = Object.keys(manifest.dependencies ?? {})
    .filter((dependency) => dependency.startsWith("@repo/feature-"))
    .map((dependency) => dependency.replace("@repo/", ""));
  const exports = Object.keys(manifest.exports ?? {});
  const dependencyText = dependencies.length
    ? `The package declares these feature dependencies: ${dependencies.map(code).join(", ")}.`
    : "The package has no feature-package dependencies.";
  const exportText = exports.length ? exports.map(code).join(", ") : "the package root";
  return [
    `# ${manifest.name}`,
    "",
    "## Responsibility",
    "",
    `This package owns the ${code(featureId)} feature and its application, domain, infrastructure, and presentation boundaries. The feature manifest is exported through ${code("src/index.ts")} and is composed by the API runtime.`,
    "",
    "## Public API",
    "",
    `The package declares these public entrypoints: ${exportText}. Consumers must use these entrypoints instead of importing internal files.`,
    "",
    MANAGED_SECTION,
    "",
    dependencyText,
    "",
    "## Database and runtime",
    "",
    `Database tables are declared by the feature manifest when this feature owns persistence. Migrations live under ${code("apps/api/migrations")} and must remain additive and operationally reversible. Seeders, if present, are executed by the API test/bootstrap composition.`,
    "",
    "## Testing",
    "",
    `Run the package tests with ${code(`pnpm --filter ${manifest.name} test`)}. Unit tests are colocated under ${code("src/**/__tests__")}; integration and composition-level tests must use the package or API test boundaries documented in the repository.`,
    "",
  ].join("\n");
}

const missing = [];
const stale = [];
const handWritten = [];
let inSync = 0;

for (const directory of featurePackages()) {
  const target = path.join(directory, "README.md");
  const relative = path.relative(root, target);
  if (!fs.existsSync(target)) {
    missing.push({ status: "MISSING", target, relative, content: renderReadme(directory) });
    continue;
  }
  const current = fs.readFileSync(target, "utf8");
  if (!current.includes(MANAGED_SECTION)) {
    handWritten.push(relative);
    continue;
  }
  const content = renderReadme(directory);
  if (content === current) {
    inSync += 1;
    continue;
  }
  stale.push({ status: "STALE", target, relative, content });
}

for (const file of handWritten) {
  console.log(`HAND-WRITTEN (not generated, skipped) ${file}`);
}

for (const { status, target, relative, content } of [...missing, ...stale]) {
  if (checkOnly) {
    console.log(`${status} ${relative}`);
    continue;
  }
  if (dryRun) {
    console.log(`WOULD WRITE ${relative}`);
    continue;
  }
  fs.writeFileSync(target, content, "utf8");
  console.log(`${status === "MISSING" ? "CREATED" : "UPDATED"} ${relative}`);
}

const drifted = missing.length + stale.length;
if (checkOnly) {
  if (drifted > 0) {
    console.error(
      `Feature README check failed: ${missing.length} missing, ${stale.length} stale. ` +
        `Run \`node scripts/generate-feature-readmes.mjs\` to regenerate them from the manifests.`,
    );
    process.exitCode = 1;
  } else {
    console.log(
      `Feature README check passed. ${inSync} generated README(s) match their manifest, ` +
        `${handWritten.length} hand-written file(s) skipped.`,
    );
  }
} else if (!dryRun) {
  if (drifted === 0) console.log("No missing or stale feature README found.");
  console.log(
    `Feature READMEs: ${inSync} already in sync, ${missing.length} created, ${stale.length} updated, ` +
      `${handWritten.length} hand-written file(s) left untouched.`,
  );
} else {
  console.log(`Would write ${drifted} file(s).`);
}
