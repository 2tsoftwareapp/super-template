#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import ts from "typescript";

import { formatGhostDependencyErrors, findGhostDependencies } from "./lib/ghost-dependencies.mjs";

const root = process.cwd();
const packageRoot = resolve(root, "packages");
const featureDirs = readdirSync(packageRoot)
  .filter((name) => name.startsWith("feature-") && statSync(join(packageRoot, name)).isDirectory())
  .sort();
const failures = [];
const fail = (message) => failures.push(`Manifest guard failed: ${message}`);

/** Generated/test/type-declaration files that carry no cross-feature imports worth enforcing. */
const isIgnoredSourceFile = (file) =>
  file.endsWith(".d.ts") || file.includes("/__tests__/") || file.includes("/node_modules/");

const entryReexports = (entry, target) => {
  const source = ts.createSourceFile(
    entry,
    readFileSync(entry, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  return source.statements.some((statement) => {
    if (
      !ts.isExportDeclaration(statement) ||
      !statement.moduleSpecifier ||
      !ts.isStringLiteral(statement.moduleSpecifier)
    )
      return false;
    const candidate = resolve(
      dirname(entry),
      statement.moduleSpecifier.text.endsWith(".ts")
        ? statement.moduleSpecifier.text
        : `${statement.moduleSpecifier.text}.ts`,
    );
    return candidate === target;
  });
};

const sourceFiles = (directory) => {
  const result = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...sourceFiles(file));
    else if (entry.name.endsWith(".ts")) result.push(file);
  }
  return result;
};

const literal = (node, label, file) => {
  if (!node || !ts.isStringLiteral(node)) {
    fail(`${file}: ${label} must be a string literal.`);
    return undefined;
  }
  return node.text;
};
const literals = (node, label, file) => {
  if (!node) return [];
  if (!ts.isArrayLiteralExpression(node)) {
    fail(`${file}: ${label} must be an array literal.`);
    return [];
  }
  return node.elements.flatMap((element) => {
    const value = literal(element, label, file);
    return value === undefined ? [] : [value];
  });
};

/** Discover exactly the exported defineFeature manifest in a package. */
function discoverManifest(file) {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const result = [];
  for (const statement of source.statements) {
    if (
      !ts.isVariableStatement(statement) ||
      !statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    )
      continue;
    for (const declaration of statement.declarationList.declarations) {
      const init = declaration.initializer;
      if (
        !init ||
        !ts.isCallExpression(init) ||
        !ts.isIdentifier(init.expression) ||
        init.expression.text !== "defineFeature"
      )
        continue;
      if (
        !ts.isIdentifier(declaration.name) ||
        init.arguments.length !== 1 ||
        !ts.isObjectLiteralExpression(init.arguments[0])
      ) {
        fail(`${file}: malformed defineFeature declaration.`);
        continue;
      }
      const obj = init.arguments[0];
      const get = (name) =>
        obj.properties.find(
          (p) => ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === name,
        )?.initializer;
      const id = literal(get("id"), "id", file);
      if (id) result.push({ id, dependsOn: literals(get("dependsOn"), "dependsOn", file), file });
    }
  }
  return result;
}

const manifests = [];
for (const dir of featureDirs) {
  const packageDir = join(packageRoot, dir);
  const pkg = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8"));
  const found = sourceFiles(join(packageDir, "src")).flatMap(discoverManifest);
  if (found.length === 0) {
    fail(`${dir}: no exported defineFeature manifest discovered.`);
    continue;
  }
  if (found.length !== 1) {
    fail(`${dir}: expected exactly one exported feature manifest, found ${found.length}.`);
    continue;
  }
  const manifest = { ...found[0], dir, pkg, packageDir, pkgName: pkg.name };
  const entry = pkg.exports?.["."];
  if (typeof entry !== "string")
    fail(`${dir}: missing package.json exports["."] feature entrypoint.`);
  else {
    const entryFile = resolve(packageDir, entry);
    if (entryFile !== resolve(manifest.file) && !entryReexports(entryFile, resolve(manifest.file)))
      fail(`${dir}: public entrypoint ${entry} does not export the discovered manifest.`);
  }
  manifests.push(manifest);
}

const byId = new Map();
const byPackage = new Map(manifests.map((m) => [m.pkgName, m]));
for (const manifest of manifests) {
  if (byId.has(manifest.id)) fail(`duplicate feature id "${manifest.id}".`);
  byId.set(manifest.id, manifest);
}

const featurePackage = /^@repo\/feature-[a-z0-9-]+$/;
const ALLOWED_SUBPATHS = ["", "/contracts", "/module", "/schema", "/testing", "/guard"];

/** Parse an import specifier into { packageName, subpath } without assuming node:resolution. */
function splitImportSpecifier(specifier) {
  const segments = specifier.split("/");
  if (specifier.startsWith("@"))
    return {
      packageName: segments.slice(0, 2).join("/"),
      subpath: `/${segments.slice(2).join("/")}`,
    };
  return { packageName: segments[0], subpath: `/${segments.slice(1).join("/")}` };
}

/** Collect every non-generated, non-test .ts file under a package src. */
function scanPackageSources(packageDir) {
  return sourceFiles(join(packageDir, "src")).filter((file) => !isIgnoredSourceFile(file));
}

for (const manifest of manifests) {
  const packageDeps = Object.keys(manifest.pkg.dependencies ?? {}).filter((name) =>
    featurePackage.test(name),
  );
  for (const depPackage of packageDeps) {
    const dep = byPackage.get(depPackage);
    if (!dep) fail(`${manifest.dir}: package dependency ${depPackage} has no validated manifest.`);
    else if (!manifest.dependsOn.includes(dep.id))
      fail(`${manifest.dir}: package dependency ${depPackage} is missing from dependsOn.`);
  }
  for (const depId of manifest.dependsOn) {
    const dep = byId.get(depId);
    if (!dep) fail(`${manifest.dir}: dependsOn references unknown feature "${depId}".`);
    else if (!packageDeps.includes(dep.pkgName))
      fail(`${manifest.dir}: dependsOn "${depId}" lacks a matching package dependency.`);
  }

  // --- Scan EVERY source file in the package (not just the manifest file) ---
  for (const file of scanPackageSources(manifest.packageDir)) {
    const source = ts.createSourceFile(
      file,
      readFileSync(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );
    for (const statement of source.statements) {
      if (!ts.isImportDeclaration(statement)) continue;
      const spec = statement.moduleSpecifier;
      if (!ts.isStringLiteral(spec)) continue;
      if (
        !featurePackage.test(spec.text) &&
        !featurePackage.test(splitImportSpecifier(spec.text).packageName)
      )
        continue;

      const { packageName, subpath } = splitImportSpecifier(spec.text);
      if (!featurePackage.test(packageName)) continue;

      // Same-package self-imports are allowed only via the declared subpath exports.
      if (packageName === manifest.pkgName) {
        const declared = new Set(
          Object.keys(manifest.pkg.exports ?? {})
            .filter((k) => k !== ".")
            .map((k) => (k.startsWith("./") ? k.slice(1) : k)),
        );
        const normalized = subpath === "/" ? "" : subpath;
        if (normalized && !declared.has(normalized))
          fail(`${file}: deep self-import "${spec.text}" bypasses declared subpath exports.`);
        continue;
      }

      const dep = byPackage.get(packageName);
      if (!dep) {
        fail(
          `${file}: cross-feature import "${spec.text}" targets a package without a validated manifest.`,
        );
        continue;
      }
      if (!packageDeps.includes(packageName)) {
        fail(
          `${file}: cross-feature import "${spec.text}" is missing from package.json dependencies of ${manifest.dir}.`,
        );
        continue;
      }
      if (!manifest.dependsOn.includes(dep.id)) {
        fail(
          `${file}: undeclared cross-feature import "${spec.text}" (feature "${dep.id}" not in dependsOn of "${manifest.id}").`,
        );
        continue;
      }

      // Subpath must be a documented export — deep imports into src/infrastructure/presentation/testing are rejected.
      // package.json keys use the "./subpath" form; normalize to "/subpath".
      const declaredSubpaths = new Set(
        Object.keys(dep.pkg.exports ?? {})
          .filter((k) => k !== ".")
          .map((k) => (k.startsWith("./") ? k.slice(1) : k)),
      );
      const normalizedSubpath = subpath === "/" ? "" : subpath;
      if (normalizedSubpath && !declaredSubpaths.has(normalizedSubpath)) {
        fail(
          `${file}: cross-feature import "${spec.text}" is not a declared subpath export of ${dep.pkgName}.`,
        );
      }
    }
  }
}

// Ghost dependency check: every dependsOn edge must have at least one
// cross-feature import in the depending package's own sources.
const ghostDeps = findGhostDependencies(
  manifests.map((m) => ({
    id: m.id,
    packageName: m.pkgName,
    packageDir: m.packageDir,
    dependsOn: m.dependsOn,
  })),
  new Map(manifests.map((m) => [m.id, { id: m.id, packageName: m.pkgName }])),
);
for (const message of formatGhostDependencyErrors(ghostDeps)) fail(message);

// Dependency cycle check (dependsOn only — capability edges were removed from the manifest model).
const graph = new Map(manifests.map((m) => [m.id, new Set(m.dependsOn)]));
const visiting = new Set();
const visited = new Set();
function visit(id, stack) {
  if (visited.has(id)) return;
  if (visiting.has(id)) {
    fail(`dependency cycle: ${[...stack, id].join(" -> ")}.`);
    return;
  }
  visiting.add(id);
  for (const dep of graph.get(id) ?? []) if (byId.has(dep)) visit(dep, [...stack, id]);
  visiting.delete(id);
  visited.add(id);
}
for (const manifest of manifests) visit(manifest.id, []);

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(
  `Feature manifest dependency guard passed for ${manifests.length} feature packages (all source files scanned).`,
);
