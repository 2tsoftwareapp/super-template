#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const code = (value) => `\`${value}\``;

for (const name of fs.readdirSync(path.join(root, "packages"))) {
  if (!name.startsWith("feature-")) continue;
  const directory = path.join(root, "packages", name);
  const manifestPath = path.join(directory, "package.json");
  if (!fs.existsSync(manifestPath)) continue;
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const sourceDirectory = path.join(directory, "src");
  const featureFile = fs.readdirSync(sourceDirectory).find((file) => file.endsWith(".feature.ts"));
  const featureSource = featureFile
    ? fs.readFileSync(path.join(sourceDirectory, featureFile), "utf8")
    : "";
  const featureId =
    featureSource.match(/id:\s*["']([^"']+)["']/)?.[1] ?? name.replace(/^feature-/, "");
  const dependencies = Object.keys(manifest.dependencies ?? {})
    .filter((dependency) => dependency.startsWith("@repo/feature-"))
    .map((dependency) => dependency.replace("@repo/", ""));
  const exports = Object.keys(manifest.exports ?? {});
  const dependencyText = dependencies.length
    ? `The package declares these feature dependencies: ${dependencies.map(code).join(", ")}.`
    : "The package has no feature-package dependencies.";
  const exportText = exports.length ? exports.map(code).join(", ") : "the package root";
  const content = [
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
    "## Feature dependencies",
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
  const target = path.join(directory, "README.md");
  if (!fs.existsSync(target)) {
    fs.writeFileSync(target, content, "utf8");
    console.log(`CREATED ${path.relative(root, target)}`);
  }
}
