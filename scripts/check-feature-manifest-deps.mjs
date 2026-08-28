#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import ts from "typescript";

const root = process.cwd();
const packageRoot = resolve(root, "packages");
const featureDirs = readdirSync(packageRoot).filter((name) => name.startsWith("feature-") && statSync(join(packageRoot, name)).isDirectory()).sort();
const failures = [];
const fail = (message) => failures.push(`Manifest guard failed: ${message}`);
const entryReexports = (entry, target) => {
  const source = ts.createSourceFile(entry, readFileSync(entry, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  return source.statements.some((statement) => {
    if (!ts.isExportDeclaration(statement) || !statement.moduleSpecifier || !ts.isStringLiteral(statement.moduleSpecifier)) return false;
    const candidate = resolve(dirname(entry), statement.moduleSpecifier.text.endsWith(".ts") ? statement.moduleSpecifier.text : `${statement.moduleSpecifier.text}.ts`);
    return candidate === target;
  });
};
const sourceFiles = (directory) => {
  const result = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...sourceFiles(file));
    else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts")) result.push(file);
  }
  return result;
};
const literal = (node, label, file) => {
  if (!node || !ts.isStringLiteral(node)) { fail(`${file}: ${label} must be a string literal.`); return undefined; }
  return node.text;
};
const literals = (node, label, file) => {
  if (!node) return [];
  if (!ts.isArrayLiteralExpression(node)) { fail(`${file}: ${label} must be an array literal.`); return []; }
  return node.elements.flatMap((element) => { const value = literal(element, label, file); return value === undefined ? [] : [value]; });
};
function discover(file) {
  const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const result = [];
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement) || !statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) continue;
    for (const declaration of statement.declarationList.declarations) {
      const init = declaration.initializer;
      if (!init || !ts.isCallExpression(init) || !ts.isIdentifier(init.expression) || init.expression.text !== "defineFeature") continue;
      if (!ts.isIdentifier(declaration.name) || init.arguments.length !== 1 || !ts.isObjectLiteralExpression(init.arguments[0])) { fail(`${file}: malformed defineFeature declaration.`); continue; }
      const obj = init.arguments[0];
      const get = (name) => obj.properties.find((p) => ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === name)?.initializer;
      const id = literal(get("id"), "id", file);
      if (id) result.push({ id, dependsOn: literals(get("dependsOn"), "dependsOn", file), requires: literals(get("requires"), "requires", file), provides: literals(get("provides"), "provides", file), file, imports: source.statements.filter(ts.isImportDeclaration) });
    }
  }
  return result;
}
const manifests = [];
for (const dir of featureDirs) {
  const packageDir = join(packageRoot, dir);
  const pkg = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8"));
  const found = sourceFiles(join(packageDir, "src")).flatMap(discover);
  if (found.length === 0) { fail(`${dir}: no exported defineFeature manifest discovered.`); continue; }
  if (found.length !== 1) { fail(`${dir}: expected exactly one exported feature manifest, found ${found.length}.`); continue; }
  const manifest = { ...found[0], dir, pkg, packageDir, pkgName: pkg.name };
  const entry = pkg.exports?.["."];
  if (typeof entry !== "string") fail(`${dir}: missing package.json exports["."] feature entrypoint.`);
  else {
    const entryFile = resolve(packageDir, entry);
    if (entryFile !== resolve(manifest.file) && !entryReexports(entryFile, resolve(manifest.file))) fail(`${dir}: public entrypoint ${entry} does not export the discovered manifest.`);
  }
  manifests.push(manifest);
}
const byId = new Map();
const byPackage = new Map(manifests.map((m) => [m.pkgName, m]));
for (const manifest of manifests) { if (byId.has(manifest.id)) fail(`duplicate feature id "${manifest.id}".`); byId.set(manifest.id, manifest); }
const featurePackage = /^@repo\/feature-[a-z0-9-]+$/;
for (const manifest of manifests) {
  const packageDeps = Object.keys(manifest.pkg.dependencies ?? {}).filter((name) => featurePackage.test(name));
  for (const depPackage of packageDeps) {
    const dep = byPackage.get(depPackage);
    if (!dep) fail(`${manifest.dir}: package dependency ${depPackage} has no validated manifest.`);
    else if (!manifest.dependsOn.includes(dep.id)) fail(`${manifest.dir}: package dependency ${depPackage} is missing from dependsOn.`);
  }
  for (const depId of manifest.dependsOn) {
    const dep = byId.get(depId);
    if (!dep) fail(`${manifest.dir}: dependsOn references unknown feature "${depId}".`);
    else if (!packageDeps.includes(dep.pkgName)) fail(`${manifest.dir}: dependsOn "${depId}" lacks a matching package dependency.`);
  }
  for (const importDecl of manifest.imports) {
    const spec = importDecl.moduleSpecifier;
    if (!ts.isStringLiteral(spec) || !featurePackage.test(spec.text) || spec.text === manifest.pkgName) continue;
    const dep = byPackage.get(spec.text);
    if (!dep) fail(`${manifest.dir}: source import ${spec.text} has no validated manifest.`);
    else if (!manifest.dependsOn.includes(dep.id)) fail(`${manifest.dir}: undeclared cross-feature source import ${spec.text}.`);
  }
}
const providers = new Map();
for (const manifest of manifests) for (const capability of manifest.provides) { if (providers.has(capability)) fail(`capability "${capability}" has duplicate providers.`); else providers.set(capability, manifest); }
for (const manifest of manifests) for (const capability of manifest.requires) if (!providers.has(capability)) fail(`${manifest.id} requires capability "${capability}" but no provider exists.`);
const graph = new Map(manifests.map((m) => [m.id, new Set(m.dependsOn)]));
for (const manifest of manifests) for (const capability of manifest.requires) { const provider = providers.get(capability); if (provider && provider.id !== manifest.id) graph.get(manifest.id).add(provider.id); }
const visiting = new Set(); const visited = new Set();
function visit(id, stack) { if (visited.has(id)) return; if (visiting.has(id)) { fail(`dependency/capability cycle: ${[...stack, id].join(" -> ")}.`); return; } visiting.add(id); for (const dep of graph.get(id) ?? []) if (byId.has(dep)) visit(dep, [...stack, id]); visiting.delete(id); visited.add(id); }
for (const manifest of manifests) visit(manifest.id, []);
if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
console.log(`Feature manifest dependency guard passed for ${manifests.length} feature packages.`);
