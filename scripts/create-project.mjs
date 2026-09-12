#!/usr/bin/env node
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { checkbox } from "@inquirer/prompts";
import { discoverFeatureCatalog, resolveFeatureSelection } from "./lib/feature-catalog.mjs";

const GENERATOR_VERSION = 1;
const FEATURE_PACKAGE = /^@repo\/feature-[a-z0-9-]+$/;
const SUPPORTED_SURFACES = new Set(["api"]);
const EXCLUDED_SEGMENTS = new Set([
  ".agent-work",
  ".git",
  ".next",
  ".turbo",
  "build",
  "coverage",
  "dist",
  "node_modules",
]);

const HELP = `Create a customized project from package features.

Usage:
  node scripts/create-project.mjs --target ../my-project
  node scripts/create-project.mjs --features health,audit --target ../my-project

Options:
  --features <ids>  Comma-separated or repeated feature IDs; omit in a TTY to select interactively.
  --tenant-mode <mode>
                     Select shared-schema or schema-per-tenant tenant isolation.
  --read-replica     Enable the database-read-replica capability.
  --target <dir>    New or previously generated project directory (required).
  --source <dir>    Template repository (default: current directory).
  --surfaces <ids>  Requested surfaces (default: api; only api is supported today).
  --dry-run         Preview copy and file mutations without writing.
  --check           Verify an existing generated target without writing.
  --skip-install    Do not run pnpm install after generation.
  --refresh-lockfile
                    With --skip-install, also re-resolve pnpm-lock.yaml (slow, needs network).
  --help            Show this help.
`;

/**
 * Parse the small, explicit CLI surface so target safety can run before any write.
 * @param {string[]} argv
 * @returns {{features: string[], featuresProvided: boolean, tenantMode: string | undefined, readReplica: boolean, target: string | undefined, source: string, surfaces: string[], dryRun: boolean, check: boolean, skipInstall: boolean, refreshLockfile: boolean, help: boolean}}
 */
function parseArgs(argv) {
  const result = {
    features: [],
    featuresProvided: false,
    tenantMode: undefined,
    readReplica: false,
    target: undefined,
    source: process.cwd(),
    surfaces: ["api"],
    dryRun: false,
    check: false,
    skipInstall: false,
    refreshLockfile: false,
    help: false,
  };
  const values = new Set(["--features", "--target", "--source", "--surfaces", "--tenant-mode"]);

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") {
      result.help = true;
      continue;
    }
    if (argument === "--dry-run") {
      result.dryRun = true;
      continue;
    }
    if (argument === "--check") {
      result.check = true;
      continue;
    }
    if (argument === "--skip-install") {
      result.skipInstall = true;
      continue;
    }
    if (argument === "--refresh-lockfile") {
      result.refreshLockfile = true;
      continue;
    }
    if (argument === "--read-replica") {
      result.readReplica = true;
      continue;
    }

    const [name, inlineValue] = argument.split("=", 2);
    if (!values.has(name)) {
      throw new Error(`Unknown option "${argument}". Use --help for usage.`);
    }
    const value = inlineValue ?? argv[++index];
    if (!value || value.startsWith("--")) {
      throw new Error(`Option "${name}" requires a value.`);
    }
    if (name === "--features") {
      result.featuresProvided = true;
      result.features.push(...value.split(","));
    } else if (name === "--target") result.target = value;
    else if (name === "--source") result.source = value;
    else if (name === "--surfaces") result.surfaces = value.split(",");
    else if (name === "--tenant-mode") {
      if (!new Set(["shared-schema", "schema-per-tenant"]).has(value)) {
        throw new Error(
          `Unsupported tenant mode "${value}". Use shared-schema or schema-per-tenant.`,
        );
      }
      if (result.tenantMode && result.tenantMode !== value) {
        throw new Error(
          `Conflicting --tenant-mode values: ${result.tenantMode}, ${value}. Select one mode.`,
        );
      }
      result.tenantMode = value;
    }
  }

  result.features = result.features.map((feature) => feature.trim()).filter(Boolean);
  result.surfaces = result.surfaces.map((surface) => surface.trim()).filter(Boolean);
  return result;
}

/**
 * Build the interactive choices from the same discovered catalog used by the resolver.
 * @param {import("./lib/feature-catalog.mjs").FeatureCatalog} catalog
 * @returns {{name: string, value: string, short: string, description?: string}[]}
 */
export function buildFeatureChoices(catalog) {
  return catalog.features.map((feature) => ({
    name: feature.id,
    value: feature.id,
    short: feature.id,
    description: [
      ...(feature.dependsOn.length > 0
        ? [`requires: ${feature.dependsOn.join(", ")}`]
        : ["no direct dependencies"]),
      ...(feature.capability
        ? [`capability: ${feature.capability.family}/${feature.capability.variant}`]
        : []),
      ...(feature.database?.readReplica ? ["eventual reads via replica"] : []),
    ].join("; "),
  }));
}

/**
 * Ask the user to choose feature packages while leaving dependency closure to the resolver.
 * @param {import("./lib/feature-catalog.mjs").FeatureCatalog} catalog
 * @param {(config: {message: string, choices: ReturnType<typeof buildFeatureChoices>, pageSize: number, instructions: string, required: boolean}) => Promise<string[]>} prompt
 * @returns {Promise<string[]>}
 */
export async function selectFeaturesInteractively(catalog, prompt = checkbox) {
  try {
    const selected = await prompt({
      message: "Select feature packages to include",
      choices: buildFeatureChoices(catalog),
      pageSize: 12,
      instructions: "Use ↑/↓ to navigate, Space to toggle, Enter to confirm",
      required: true,
    });
    if (selected.length === 0) throw new Error("At least one feature must be selected.");
    return selected;
  } catch (error) {
    if (error && typeof error === "object" && "name" in error && error.name === "ExitPromptError") {
      throw new Error("Feature selection cancelled.");
    }
    throw error;
  }
}

/**
 * Return whether a path is the same as or nested below another path.
 * @param {string} parent
 * @param {string} child
 * @returns {boolean}
 */
function isWithin(parent, child) {
  const childRelative = relative(parent, child);
  return childRelative === "" || (!childRelative.startsWith(`..${sep}`) && childRelative !== "..");
}

/**
 * Resolve an existing path, or the nearest existing parent for a new path.
 * This closes the symlink escape where a target path appears outside the
 * source lexically but resolves into the source tree at write time.
 * @param {string} inputPath
 * @returns {string}
 */
function canonicalPath(inputPath) {
  const absolute = resolve(inputPath);
  const missingSegments = [];
  let existing = absolute;
  while (!existsSync(existing)) {
    const parent = dirname(existing);
    if (parent === existing) return absolute;
    missingSegments.unshift(basename(existing));
    existing = parent;
  }
  return resolve(realpathSync(existing), ...missingSegments);
}

/**
 * Validate generation targets before copying or rewriting any files.
 * @param {{source: string, target: string, check: boolean, dryRun: boolean}} input
 * @returns {{exists: boolean, isNew: boolean, source: string, target: string}}
 */
function validateTarget(input) {
  const source = canonicalPath(input.source);
  const target = canonicalPath(input.target);
  if (source === target) throw new Error("Source and target must be different directories.");
  if (isWithin(source, target)) {
    throw new Error("Target cannot be inside the template source directory.");
  }
  if (existsSync(target) && !statSync(target).isDirectory()) {
    throw new Error(`Target is not a directory: ${target}`);
  }
  if (input.check && !existsSync(target)) {
    throw new Error(`Cannot check missing target directory: ${target}`);
  }

  const exists = existsSync(target);
  if (!exists) return { exists: false, isNew: true, source, target };
  const entries = readdirNames(target);
  const recognized = entries.includes("feature-profile.json");
  if (entries.length > 0 && !recognized) {
    throw new Error(`Refusing to mutate non-empty target without feature-profile.json: ${target}`);
  }
  return { exists: true, isNew: entries.length === 0, source, target };
}

/**
 * Read directory names through a narrow helper so target checks stay testable.
 * @param {string} directory
 * @returns {string[]}
 */
function readdirNames(directory) {
  return readdirSync(directory, { withFileTypes: true }).map((entry) => entry.name);
}

/**
 * Copy the source template while excluding machine-local and generated state.
 * @param {string} source
 * @param {string} target
 */
function copyTemplate(source, target) {
  cpSync(source, target, {
    recursive: true,
    filter: (candidate) => {
      const candidateRelative = relative(source, candidate);
      if (!candidateRelative) return true;
      return !candidateRelative.split(sep).some((segment) => EXCLUDED_SEGMENTS.has(segment));
    },
  });
}

/**
 * Read and update a workspace package's feature dependencies from the resolved closure.
 * @param {string} content
 * @param {import("./lib/feature-catalog.mjs").FeaturePackage[]} features
 * @returns {string}
 */
function buildFeaturePackageJson(content, features) {
  const packageJson = JSON.parse(content);
  const dependencies = packageJson.dependencies ?? {};
  for (const dependency of Object.keys(dependencies)) {
    if (FEATURE_PACKAGE.test(dependency)) delete dependencies[dependency];
  }
  for (const feature of features) dependencies[feature.packageName] = "workspace:*";
  packageJson.dependencies = dependencies;
  return `${JSON.stringify(packageJson, null, 2)}\n`;
}

/**
 * Build the explicit shared application registry from the resolved manifest order.
 * @param {string} content
 * @param {import("./lib/feature-catalog.mjs").FeaturePackage[]} features
 * @returns {string}
 */
function buildFeatureRegistry(content, features) {
  const lines = content.split("\n");
  const featureImport = /^import \{ [A-Za-z_$][\w$]* \} from "@repo\/feature-[^"]+";$/;
  const firstFeatureImport = lines.findIndex((line) => featureImport.test(line));
  if (firstFeatureImport < 0) {
    throw new Error(
      "Cannot find feature imports in packages/app-composition/src/feature-registry.ts.",
    );
  }
  const withoutFeatureImports = lines.filter((line) => !featureImport.test(line));
  withoutFeatureImports.splice(
    firstFeatureImport,
    0,
    ...features.map(
      (feature) => `import { ${feature.manifestExport} } from "${feature.packageName}";`,
    ),
  );

  const start = withoutFeatureImports.findIndex((line) =>
    line.includes("export const enabledFeatures: readonly FeatureManifest[] = ["),
  );
  if (start < 0) throw new Error("Cannot find enabledFeatures array in feature registry.");
  const end = withoutFeatureImports.findIndex(
    (line, index) => index > start && line.trim() === "];",
  );
  if (end < 0) throw new Error("Cannot find end of enabledFeatures array in feature registry.");
  withoutFeatureImports.splice(
    start + 1,
    end - start - 1,
    ...features.map((feature) => `  ${feature.manifestExport},`),
  );
  return withoutFeatureImports.join("\n");
}

/**
 * Build stable trace output for a generation run.
 * @param {{requestedIds: string[], resolvedIds: string[], surfaces: string[]}} selection
 * @returns {string}
 */
function buildFeatureProfile(selection) {
  return `${JSON.stringify(
    {
      generator: "create-project",
      generatorVersion: GENERATOR_VERSION,
      requestedFeatures: selection.requestedIds,
      resolvedFeatures: selection.resolvedIds,
      surfaces: selection.surfaces,
      capabilities: {
        selected: selection.features
          .filter((feature) => feature.capability)
          .map((feature) => feature.id),
        tenantMode: selection.database.tenantMode,
        readReplica: selection.database.readReplica,
        readConsistency: selection.database.readConsistency,
      },
    },
    null,
    2,
  )}\n`;
}

/**
 * Create the exact known file mutations for a selected project.
 * @param {{target: string, source: string, selection: ReturnType<typeof resolveFeatureSelection>, surfaces: string[]}} input
 * @returns {{path: string, content: string, reason: string}[]}
 */
function buildMutations(input) {
  const apiPackagePath = join(input.target, "apps/api/package.json");
  const compositionPackagePath = join(input.target, "packages/app-composition/package.json");
  const registryPath = join(input.target, "packages/app-composition/src/feature-registry.ts");
  const sourceApiPackagePath = join(input.source, "apps/api/package.json");
  const sourceCompositionPackagePath = join(input.source, "packages/app-composition/package.json");
  const sourceRegistryPath = join(input.source, "packages/app-composition/src/feature-registry.ts");
  // Derive the desired state from the immutable template source. Reading an
  // existing target here would make `--check` compare a target against its own
  // drift and would silently preserve stale generated feature wiring.
  const packageContent = readFileSync(sourceApiPackagePath, "utf8");
  const registryContent = readFileSync(sourceRegistryPath, "utf8");
  return [
    {
      path: apiPackagePath,
      content: buildFeaturePackageJson(packageContent, input.selection.features),
      reason: "align API workspace feature dependencies with the resolved closure",
    },
    {
      path: compositionPackagePath,
      content: buildFeaturePackageJson(
        readFileSync(sourceCompositionPackagePath, "utf8"),
        input.selection.features,
      ),
      reason: "align shared composition package dependencies with the resolved closure",
    },
    {
      path: registryPath,
      content: buildFeatureRegistry(registryContent, input.selection.features),
      reason: "align explicit shared manifest imports and order with the resolved closure",
    },
    {
      path: join(input.target, "feature-profile.json"),
      content: buildFeatureProfile({
        ...input.selection,
        requestedIds: input.selection.requestedIds,
        resolvedIds: input.selection.resolvedIds,
        surfaces: input.surfaces,
      }),
      reason: "record the requested and auto-added feature selection",
    },
  ];
}

/**
 * Compare generated content without writing it.
 * @param {{path: string, content: string, reason: string}[]} mutations
 * @returns {string[]}
 */
function checkMutations(mutations) {
  return mutations
    .filter(
      (mutation) =>
        !existsSync(mutation.path) || readFileSync(mutation.path, "utf8") !== mutation.content,
    )
    .map((mutation) => mutation.path);
}

/**
 * Keep generated feature selection immutable after the first generation.
 * Existing targets may contain user-owned files, so changing the selection in
 * place is rejected before any generator-owned file is written.
 *
 * Both halves of the recorded selection are compared. Two different requests can
 * resolve to the same closure (for example `auth` and `auth,users`), and
 * `feature-profile.json` records the request as well as the closure, so
 * comparing only the closure would let a different request rewrite the profile.
 * @param {string} target
 * @param {{requestedIds: string[], resolvedIds: string[]}} selection
 */
function assertImmutableFeatureSelection(target, selection) {
  if (!existsSync(join(target, "feature-profile.json"))) return;
  let profile;
  try {
    profile = JSON.parse(readFileSync(join(target, "feature-profile.json"), "utf8"));
  } catch {
    throw new Error(
      `Cannot parse existing feature-profile.json in ${target}. Repair it manually or create a new target.`,
    );
  }
  const previousRequested = Array.isArray(profile.requestedFeatures)
    ? profile.requestedFeatures
    : null;
  const previousResolved = Array.isArray(profile.resolvedFeatures) ? profile.resolvedFeatures : null;
  if (!previousRequested || !previousResolved) {
    throw new Error(
      `Existing target ${target} has no valid requestedFeatures and resolvedFeatures in feature-profile.json. Create a new target.`,
    );
  }
  const sameRequested =
    JSON.stringify(previousRequested) === JSON.stringify(selection.requestedIds);
  const sameResolved = JSON.stringify(previousResolved) === JSON.stringify(selection.resolvedIds);
  if (!sameRequested || !sameResolved) {
    throw new Error(
      `Existing generated target has immutable feature selection ` +
        `(requested [${previousRequested.join(", ")}], resolved [${previousResolved.join(", ")}]), ` +
        `but requested [${selection.requestedIds.join(", ")}] resolving to [${selection.resolvedIds.join(", ")}]. ` +
        "Create a new target for a different selection; user-owned files are never reconciled in place.",
    );
  }
}

/**
 * Write a file through an adjacent temporary name so a failed serialization
 * cannot leave a half-written generated registry or package manifest.
 * @param {string} file
 * @param {string} content
 */
function writeAtomic(file, content) {
  mkdirSync(resolve(file, ".."), { recursive: true });
  const temporary = `${file}.tmp-${process.pid}`;
  writeFileSync(temporary, content, "utf8");
  renameSync(temporary, file);
}

/**
 * Refresh pnpm-lock.yaml after the generated manifests were rewritten.
 *
 * buildMutations rewrites workspace manifests (notably
 * packages/app-composition/package.json), which leaves the copied lockfile
 * describing the template's dependency set. CI installs with --frozen-lockfile by
 * default, so an un-refreshed lockfile makes the very first install fail.
 *
 * Failures are warnings: the user can always run `pnpm install` themselves.
 * @param {string} target
 */
function refreshLockfile(target) {
  if (!existsSync(join(target, "pnpm-lock.yaml"))) return;
  process.stdout.write("Refreshing pnpm-lock.yaml to match the generated manifests...\n");
  const lockfile = spawnSync("pnpm", ["install", "--lockfile-only", "--ignore-scripts"], {
    cwd: target,
    encoding: "utf8",
  });
  if (lockfile.error || lockfile.status !== 0) {
    process.stdout.write(
      "Warning: could not refresh pnpm-lock.yaml. Run `pnpm install` in the generated project before committing.\n",
    );
    return;
  }
  process.stdout.write("Refreshed pnpm-lock.yaml.\n");
}

/**
 * Execute the project generation flow.
 *
 * Flow:
 *   1. Parse and validate selection/target boundaries.
 *   2. Discover package manifests and resolve transitive dependencies.
 *   3. If no scripted selection was supplied, ask for package IDs in an interactive TTY.
 *   4. Preview or apply the target copy and known file mutations.
 *   5. Optionally link dependencies with pnpm.
 * Trace: PLAN.md#Scope and TASKS.md#T-001 through T-004, T-008.
 */
export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    process.stdout.write(HELP);
    return;
  }
  if (args.dryRun && args.check) throw new Error("Use only one of --dry-run or --check.");
  if (!args.target) throw new Error("--target is required.");
  if (args.surfaces.length === 0) throw new Error("--surfaces must contain at least one surface.");
  for (const surface of args.surfaces) {
    if (!SUPPORTED_SURFACES.has(surface)) {
      throw new Error(
        `Surface "${surface}" is not supported by the current package-owned generator.`,
      );
    }
  }

  const targetState = validateTarget({
    source: args.source,
    target: args.target,
    check: args.check,
    dryRun: args.dryRun,
  });
  const { source, target } = targetState;
  const catalog = discoverFeatureCatalog(source);
  const aliasedFeatures = [];
  if (args.tenantMode) {
    aliasedFeatures.push(
      args.tenantMode === "shared-schema" ? "tenant-shared-schema" : "tenant-schema",
    );
  }
  if (args.readReplica) aliasedFeatures.push("database-read-replica");
  args.features.push(...aliasedFeatures);
  if (args.features.length === 0) {
    if (args.featuresProvided) {
      throw new Error("--features must contain at least one feature ID.");
    }
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      throw new Error(
        "No feature selection provided. Run in an interactive terminal or pass --features <ids>.",
      );
    }
    args.features = await selectFeaturesInteractively(catalog);
  }
  if (new Set(args.features).size !== args.features.length) {
    throw new Error("A feature ID was selected more than once.");
  }
  const selection = resolveFeatureSelection(catalog, args.features);
  if (targetState.exists) {
    assertImmutableFeatureSelection(target, selection);
  }
  const mutations = buildMutations({ source, target, selection, surfaces: args.surfaces });

  process.stdout.write(`Requested features: ${selection.requestedIds.join(", ")}\n`);
  process.stdout.write(`Resolved features: ${selection.resolvedIds.join(", ")}\n`);
  if (selection.autoAddedIds.length > 0) {
    process.stdout.write(`Auto-added dependencies: ${selection.autoAddedIds.join(", ")}\n`);
  }
  process.stdout.write(`Target: ${target}\n`);

  if (args.check) {
    const drift = checkMutations(mutations);
    if (drift.length > 0) {
      throw new Error(
        `Generated target is out of date:\n${drift.map((file) => `  ${file}`).join("\n")}`,
      );
    }
    process.stdout.write(
      "Check passed: generated target matches the requested feature selection.\n",
    );
    return;
  }

  for (const mutation of mutations) {
    process.stdout.write(
      `${args.dryRun ? "Would write" : "Write"}: ${relative(target, mutation.path)} (${mutation.reason})\n`,
    );
  }
  if (args.dryRun) {
    process.stdout.write(
      `Dry run complete: ${targetState.isNew ? "new target" : "existing generated target"}; no files changed.\n`,
    );
    return;
  }

  if (targetState.isNew) {
    mkdirSync(target, { recursive: true });
    copyTemplate(source, target);
  }
  for (const mutation of mutations) writeAtomic(mutation.path, mutation.content);

  if (!args.skipInstall) {
    const result = spawnSync("pnpm", ["install"], { cwd: target, stdio: "inherit" });
    if (result.error) throw result.error;
    if (result.status !== 0)
      throw new Error(`pnpm install failed with exit code ${result.status}.`);
  } else if (args.refreshLockfile) {
    refreshLockfile(target);
  } else {
    process.stdout.write(
      `Skipped install. Next: \`cd ${target} && git init && pnpm install\` — the generated manifests no longer match the copied pnpm-lock.yaml, so install is required before --frozen-lockfile (or re-run with --refresh-lockfile to re-resolve it).\n`,
    );
  }

  process.stdout.write(`Project generated successfully at ${target}.\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error) => {
    process.stderr.write(`\nerror: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
