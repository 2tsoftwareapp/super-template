#!/usr/bin/env node
/**
 * Keeps feature manifests honest:
 *   1. Every @repo/feature-* workspace dependency of a feature package must be
 *      declared in that feature's manifest `dependsOn`.
 *   2. Every `dependsOn` id must exist.
 *   3. The dependsOn graph must stay acyclic.
 *
 * Runtime port bindings (consumer-owned tokens bound through @Global modules)
 * intentionally do NOT require a static dependency — Nest fails fast at boot
 * when a binding is missing.
 */
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const packagesDir = resolve("packages");
const features = []; // { pkgName, dir, id, dependsOn }

for (const dir of readdirSync(packagesDir)) {
  if (!dir.startsWith("feature-")) continue;
  const manifestPath = resolve(packagesDir, dir, "src", `${dir.replace(/^feature-/, "")}.feature.ts`);
  let manifestText;
  try {
    manifestText = readFileSync(manifestPath, "utf8");
  } catch {
    continue; // no manifest in this package
  }
  const idMatch = manifestText.match(/id:\s*"([^"]+)"/);
  const depMatch = manifestText.match(/dependsOn:\s*\[([^\]]*)\]/s);
  const id = idMatch?.[1];
  if (!id) {
    console.error(`Manifest guard failed: cannot parse id in ${manifestPath}`);
    process.exit(1);
  }
  const dependsOn = (depMatch?.[1] ?? "")
    .split(",")
    .map((s) => s.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);

  const pkg = JSON.parse(readFileSync(resolve(packagesDir, dir, "package.json"), "utf8"));
  const featureDeps = Object.keys(pkg.dependencies ?? {}).filter((k) =>
    /^@repo\/feature-[a-z0-9-]+$/.test(k),
  );

  features.push({ pkgName: pkg.name, dir, id, dependsOn, featureDeps });
}

let failed = false;

// 1. package deps ⊆ dependsOn
const idByPkg = new Map(features.map((f) => [f.pkgName, f.id]));
for (const f of features) {
  for (const dep of f.featureDeps) {
    const depId = idByPkg.get(dep);
    if (!depId) continue; // dependency without a manifest (not a plugin feature)
    if (!f.dependsOn.includes(depId)) {
      console.error(
        `Manifest guard failed: @repo/${f.dir} depends on package ${dep} (feature "${depId}") but it is missing from dependsOn [${f.dependsOn.join(", ")}]`,
      );
      failed = true;
    }
  }
}

// 2. dependsOn ids exist
const ids = new Set(features.map((f) => f.id));
for (const f of features) {
  for (const d of f.dependsOn) {
    if (!ids.has(d)) {
      console.error(`Manifest guard failed: ${f.pkgName} dependsOn unknown feature "${d}"`);
      failed = true;
    }
  }
}

// 3. acyclicity over declared ids
const graph = new Map(features.filter((f) => ids.has(f.id)).map((f) => [f.id, f.dependsOn]));
const state = new Map(); // 1=visiting, 2=done
const stack = [];
function visit(node) {
  if (state.get(node) === 2) return true;
  if (state.get(node) === 1) {
    console.error(`Manifest guard failed: dependsOn cycle: ${[...stack, node].join(" -> ")}`);
    return false;
  }
  state.set(node, 1);
  stack.push(node);
  for (const next of graph.get(node) ?? []) {
    if (!visit(next)) return false;
  }
  stack.pop();
  state.set(node, 2);
  return true;
}
for (const id of graph.keys()) {
  if (!visit(id)) {
    failed = true;
    break;
  }
}

if (failed) process.exit(1);
console.log("Feature manifest dependency guard passed.");
