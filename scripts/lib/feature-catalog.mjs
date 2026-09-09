import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import ts from "typescript";

const FEATURE_PACKAGE = /^@repo\/feature-[a-z0-9-]+$/;

/**
 * Discoverable metadata for one backend feature package.
 * @typedef {object} FeaturePackage
 * @property {string} id
 * @property {string} packageName
 * @property {string} packageDir
 * @property {string} manifestFile
 * @property {string} manifestExport
 * @property {string[]} dependsOn
 * @property {Record<string, unknown>} packageJson
 */

/**
 * Feature catalog with stable lookup order for project generation.
 * @typedef {object} FeatureCatalog
 * @property {FeaturePackage[]} features
 * @property {Map<string, FeaturePackage>} byId
 * @property {Map<string, number>} inputOrder
 */

/**
 * Walk a directory without relying on shell glob ordering.
 * @param {string} directory
 * @returns {string[]}
 */
function sourceFiles(directory) {
  const result = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...sourceFiles(file));
    else if (entry.name.endsWith(".ts")) result.push(file);
  }
  return result;
}

/**
 * Read a string literal from a manifest property.
 * @param {ts.Node | undefined} node
 * @param {string} label
 * @param {string} file
 * @returns {string}
 */
function stringLiteral(node, label, file) {
  if (!node || !ts.isStringLiteral(node)) {
    throw new Error(`${file}: ${label} must be a string literal.`);
  }
  return node.text;
}

/**
 * Read a literal string array from a manifest property.
 * @param {ts.Node | undefined} node
 * @param {string} label
 * @param {string} file
 * @returns {string[]}
 */
function stringLiterals(node, label, file) {
  if (!node) return [];
  if (!ts.isArrayLiteralExpression(node)) {
    throw new Error(`${file}: ${label} must be an array literal.`);
  }
  return node.elements.map((element) => stringLiteral(element, label, file));
}

/**
 * Parse the one exported `defineFeature` call owned by a package.
 * @param {string} file
 * @returns {{id: string, dependsOn: string[], manifestExport: string} | undefined}
 */
function parseManifest(file) {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const found = [];

  for (const statement of source.statements) {
    if (
      !ts.isVariableStatement(statement) ||
      !statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      continue;
    }
    for (const declaration of statement.declarationList.declarations) {
      const initializer = declaration.initializer;
      if (
        !initializer ||
        !ts.isCallExpression(initializer) ||
        !ts.isIdentifier(initializer.expression) ||
        initializer.expression.text !== "defineFeature"
      ) {
        continue;
      }
      if (
        !ts.isIdentifier(declaration.name) ||
        initializer.arguments.length !== 1 ||
        !ts.isObjectLiteralExpression(initializer.arguments[0])
      ) {
        throw new Error(`${file}: malformed defineFeature declaration.`);
      }
      const object = initializer.arguments[0];
      const property = (name) =>
        object.properties.find(
          (item) =>
            ts.isPropertyAssignment(item) && ts.isIdentifier(item.name) && item.name.text === name,
        )?.initializer;
      found.push({
        id: stringLiteral(property("id"), "id", file),
        dependsOn: stringLiterals(property("dependsOn"), "dependsOn", file),
        manifestExport: declaration.name.text,
      });
    }
  }

  if (found.length > 1) {
    throw new Error(
      `${file}: expected exactly one exported defineFeature manifest, found ${found.length}.`,
    );
  }
  return found[0];
}

/**
 * Build the feature catalog from package metadata and manifest source.
 *
 * Flow:
 *   1. Discover feature package directories and parse their public manifests.
 *   2. Validate package names, IDs, and dependency references.
 *   3. Return stable lookup order so generated files do not depend on filesystem order.
 *
 * @param {string} repositoryRoot
 * @returns {FeatureCatalog}
 * @throws {Error} when package or manifest metadata is invalid.
 */
export function discoverFeatureCatalog(repositoryRoot) {
  const packagesRoot = resolve(repositoryRoot, "packages");
  const features = readdirSync(packagesRoot)
    .filter((name) => name.startsWith("feature-"))
    .filter((name) => statSync(join(packagesRoot, name)).isDirectory())
    .sort()
    .map((directoryName) => {
      const packageDir = join(packagesRoot, directoryName);
      const packageJsonPath = join(packageDir, "package.json");
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
      const manifestFiles = sourceFiles(join(packageDir, "src"));
      const manifests = manifestFiles
        .map((file) => ({ file, parsed: parseManifest(file) }))
        .filter(({ parsed }) => parsed !== undefined);
      const manifest = manifests[0];

      if (!manifest) {
        throw new Error(`${directoryName}: no exported defineFeature manifest discovered.`);
      }
      if (manifests.length !== 1) {
        throw new Error(
          `${directoryName}: expected exactly one feature manifest, found ${manifests.length}.`,
        );
      }
      if (typeof packageJson.name !== "string" || !FEATURE_PACKAGE.test(packageJson.name)) {
        throw new Error(`${directoryName}: package.json name must match @repo/feature-<id>.`);
      }

      return {
        id: manifest.parsed.id,
        packageName: packageJson.name,
        packageDir,
        manifestFile: manifest.file,
        manifestExport: manifest.parsed.manifestExport,
        dependsOn: manifest.parsed.dependsOn,
        packageJson,
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));

  const byId = new Map();
  const inputOrder = new Map();
  for (const [index, feature] of features.entries()) {
    if (byId.has(feature.id)) {
      throw new Error(`Duplicate feature id "${feature.id}".`);
    }
    byId.set(feature.id, feature);
    inputOrder.set(feature.id, index);
  }
  for (const feature of features) {
    for (const dependency of feature.dependsOn) {
      if (!byId.has(dependency)) {
        throw new Error(`Feature "${feature.id}" depends on missing feature "${dependency}".`);
      }
    }
  }

  return { features, byId, inputOrder };
}

/**
 * Resolve requested feature IDs into a deterministic transitive closure.
 *
 * @param {FeatureCatalog} catalog
 * @param {string[]} requestedIds
 * @returns {{requestedIds: string[], resolvedIds: string[], autoAddedIds: string[], features: FeaturePackage[]}}
 * @throws {Error} when an ID is unknown or the dependency graph contains a cycle.
 */
export function resolveFeatureSelection(catalog, requestedIds) {
  const requested = [...new Set(requestedIds)];
  if (requested.length === 0) {
    throw new Error("At least one feature must be selected.");
  }
  for (const id of requested) {
    if (!catalog.byId.has(id)) {
      throw new Error(
        `Unknown feature "${id}". Available features: ${catalog.features.map((feature) => feature.id).join(", ")}.`,
      );
    }
  }

  const selected = new Set(requested);
  const visiting = new Set();
  const visited = new Set();
  const ordered = [];
  const compareByCatalogOrder = (a, b) =>
    (catalog.inputOrder.get(a) ?? 0) - (catalog.inputOrder.get(b) ?? 0);

  /**
   * Visit dependencies before dependents so the generated registry can be
   * consumed by the existing topological composition helper.
   */
  const visit = (id, stack) => {
    if (visited.has(id)) return;
    if (visiting.has(id)) {
      const cycleStart = stack.indexOf(id);
      throw new Error(
        `Feature dependency cycle detected: ${[...stack.slice(cycleStart), id].join(" -> ")}`,
      );
    }
    const feature = catalog.byId.get(id);
    if (!feature) throw new Error(`Feature "${id}" is missing from the catalog.`);
    visiting.add(id);
    for (const dependency of [...feature.dependsOn].sort(compareByCatalogOrder)) {
      selected.add(dependency);
      visit(dependency, [...stack, id]);
    }
    visiting.delete(id);
    visited.add(id);
    ordered.push(feature);
  };

  for (const id of [...selected].sort(compareByCatalogOrder)) visit(id, []);

  const resolvedIds = ordered.map((feature) => feature.id);
  return {
    requestedIds: requested,
    resolvedIds,
    autoAddedIds: resolvedIds.filter((id) => !requested.includes(id)),
    features: ordered,
  };
}
