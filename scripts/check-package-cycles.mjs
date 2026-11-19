#!/usr/bin/env node
/**
 * Detect circular *runtime* dependencies between workspace packages.
 *
 * Edges come from each manifest's `dependencies` + `peerDependencies` when the
 * target is another workspace package (a `workspace:` range or an `@repo/*`
 * name present in the graph). `devDependencies` are deliberately excluded:
 * test-only tooling (e.g. `@repo/test-config`) may legitimately point back at
 * the package under test without creating a runtime cycle.
 *
 * Exits 1 and prints one `a -> b -> a` line per cycle when any SCC has more
 * than one node (or a self-edge).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const WORKSPACE_GLOBS = ["apps/*", "packages/*", "tools/*", "apps/web/e2e"];

function listWorkspaceDirs() {
  const dirs = [];

  for (const pattern of WORKSPACE_GLOBS) {
    if (!pattern.includes("*")) {
      dirs.push(pattern);
      continue;
    }

    const [parent, childPattern] = pattern.split("/");
    const parentPath = join(ROOT, parent);

    let entries;
    try {
      entries = readdirSync(parentPath);
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (childPattern !== "*" && entry !== childPattern) continue;
      dirs.push(join(parent, entry));
    }
  }

  return dirs;
}

function readManifest(relativeDir) {
  const manifestPath = join(ROOT, relativeDir, "package.json");

  try {
    if (!statSync(manifestPath).isFile()) return null;
    return JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch {
    return null;
  }
}

function buildGraph() {
  /** @type {Map<string, {dir: string, deps: string[]}>} */
  const graph = new Map();

  for (const dir of listWorkspaceDirs()) {
    const manifest = readManifest(dir);
    if (!manifest?.name) continue;
    graph.set(manifest.name, { dir, deps: [] });
  }

  for (const [name, node] of graph) {
    const manifest = readManifest(node.dir);
    const dependencies = {
      ...(manifest.dependencies ?? {}),
      ...(manifest.peerDependencies ?? {}),
    };

    for (const dependency of Object.keys(dependencies)) {
      if (dependency !== name && graph.has(dependency)) {
        node.deps.push(dependency);
      }
    }
  }

  return graph;
}

/** Tarjan's strongly connected components, iterative to avoid stack limits. */
function stronglyConnectedComponents(graph) {
  const index = new Map();
  const lowLink = new Map();
  const onStack = new Set();
  const stack = [];
  const components = [];
  let counter = 0;

  for (const start of graph.keys()) {
    if (index.has(start)) continue;

    /** @type {Array<{node: string, edge: number}>} */
    const work = [{ node: start, edge: 0 }];
    index.set(start, counter);
    lowLink.set(start, counter);
    counter += 1;
    stack.push(start);
    onStack.add(start);

    while (work.length > 0) {
      const frame = work[work.length - 1];
      const dependencies = graph.get(frame.node)?.deps ?? [];

      if (frame.edge < dependencies.length) {
        const next = dependencies[frame.edge];
        frame.edge += 1;

        if (!index.has(next)) {
          index.set(next, counter);
          lowLink.set(next, counter);
          counter += 1;
          stack.push(next);
          onStack.add(next);
          work.push({ node: next, edge: 0 });
        } else if (onStack.has(next)) {
          lowLink.set(frame.node, Math.min(lowLink.get(frame.node), index.get(next)));
        }

        continue;
      }

      work.pop();
      const parent = work[work.length - 1];

      if (parent) {
        lowLink.set(parent.node, Math.min(lowLink.get(parent.node), lowLink.get(frame.node)));
      }

      if (lowLink.get(frame.node) === index.get(frame.node)) {
        const component = [];

        for (;;) {
          const popped = stack.pop();
          onStack.delete(popped);
          component.push(popped);
          if (popped === frame.node) break;
        }

        components.push(component);
      }
    }
  }

  return components;
}

function describeCycle(graph, component) {
  const inComponent = new Set(component);
  const start = [...component].sort()[0];
  const path = [start];
  const seen = new Set([start]);

  const walk = (node) => {
    for (const next of graph.get(node)?.deps ?? []) {
      if (!inComponent.has(next)) continue;
      if (next === start) return true;
      if (seen.has(next)) continue;
      seen.add(next);
      path.push(next);
      if (walk(next)) return true;
      path.pop();
      seen.delete(next);
    }

    return false;
  };

  walk(start);
  return [...path, start].join(" -> ");
}

const graph = buildGraph();
const cycles = stronglyConnectedComponents(graph).filter(
  (component) =>
    component.length > 1 ||
    (component.length === 1 && graph.get(component[0])?.deps.includes(component[0])),
);

if (cycles.length > 0) {
  console.error(`Workspace dependency cycles detected (${cycles.length}):`);

  for (const component of cycles) {
    console.error(`  ${describeCycle(graph, component)}`);
  }

  process.exit(1);
}

console.log(`Package cycle check passed (${graph.size} workspace packages, 0 cycles).`);
