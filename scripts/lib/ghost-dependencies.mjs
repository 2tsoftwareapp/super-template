import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

const FEATURE_PACKAGE = /^@repo\/feature-[a-z0-9-]+/;

/**
 * Generated/test-support files carry no cross-feature imports worth enforcing,
 * matching scripts/check-feature-manifest-deps.mjs scan rules.
 * @param {string} file
 * @returns {boolean}
 */
function isIgnoredSourceFile(file) {
  return file.endsWith(".d.ts") || file.includes("/__tests__/") || file.includes("/node_modules/");
}

/**
 * Collect .ts source files under a directory, matching the scan rules of
 * scripts/check-feature-manifest-deps.mjs.
 * @param {string} directory
 * @returns {string[]}
 */
function sourceFiles(directory) {
  const result = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...sourceFiles(file));
    else if (entry.name.endsWith(".ts") && !isIgnoredSourceFile(file)) result.push(file);
  }
  return result;
}

/** @param {import("typescript").SourceFile} source */
function importedFeaturePackages(source) {
  const packages = new Set();
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    const specifier = statement.moduleSpecifier;
    if (!ts.isStringLiteral(specifier)) continue;
    const match = FEATURE_PACKAGE.exec(specifier.text);
    if (match) packages.add(match[0]);
  }
  return packages;
}

/**
 * Collect every cross-feature package name imported anywhere in a feature
 * package's own sources (self-imports excluded).
 * @param {string} packageDir
 * @param {string} ownPackageName
 * @returns {Set<string>}
 */
export function collectImportedFeaturePackages(packageDir, ownPackageName) {
  const imported = new Set();
  for (const file of sourceFiles(join(packageDir, "src"))) {
    const source = ts.createSourceFile(
      file,
      readFileSync(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );
    for (const packageName of importedFeaturePackages(source)) {
      if (packageName !== ownPackageName) imported.add(packageName);
    }
  }
  return imported;
}

/**
 * Find "ghost" dependencies: manifest dependsOn edges whose feature package is
 * never imported in the depending package's own sources. Such edges inflate
 * the dependency graph and force composition of unused features.
 *
 * @param {Array<{id: string, packageName: string, packageDir: string, dependsOn: string[]}>} features
 * @param {Map<string, {id: string, packageName: string}>} byId
 * @returns {Array<{featureId: string, dependencyId: string, packageName: string}>}
 */
export function findGhostDependencies(features, byId) {
  const ghosts = [];
  for (const feature of features) {
    if (feature.dependsOn.length === 0) continue; // nothing to verify
    const imported = collectImportedFeaturePackages(feature.packageDir, feature.packageName);
    for (const dependencyId of feature.dependsOn) {
      const dependency = byId.get(dependencyId);
      if (!dependency) continue; // unknown ids are reported elsewhere
      if (!imported.has(dependency.packageName)) {
        ghosts.push({
          featureId: feature.id,
          dependencyId,
          packageName: dependency.packageName,
        });
      }
    }
  }
  return ghosts;
}

/** @param {Array<{featureId: string, dependencyId: string, packageName: string}>} ghosts */
export function formatGhostDependencyErrors(ghosts) {
  return ghosts.map(
    (ghost) =>
      `ghost dependency: feature "${ghost.featureId}" declares dependsOn "${ghost.dependencyId}" but never imports ${ghost.packageName} in its own sources. Remove the edge (manifest dependsOn + package.json dependency) or add the missing integration.`,
  );
}
