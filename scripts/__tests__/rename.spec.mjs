#!/usr/bin/env node
/**
 * Rebranding guardrails for `scripts/rename.mjs`.
 *
 * The script is the documented first step of "make it yours", so it has to
 * produce a tree that builds. This suite runs it against a throwaway copy of the
 * files it rewrites (never the repository) and asserts the mobile application
 * identifier rule, plus the casing rules it already had.
 *
 * `rename.mjs` derives its root from its own location, so the fixture copies
 * `scripts/rename.mjs` + `scripts/merge-env.mjs` into a temp directory and runs
 * the copy there. The fixture has no git repository, which also exercises the
 * documented filesystem-walk fallback.
 *
 * Run with: node --test scripts/__tests__/rename.spec.mjs
 */
import assert from "node:assert/strict";
import { after, test } from "node:test";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "../..");
const temporaryRoots = [];

// Mirrors the two rebrand-relevant lines of the real
// apps/mobile/android/app/build.gradle.kts, indentation included.
const ANDROID_GRADLE = `android {
    namespace = "com.example.mobile_app"
    defaultConfig {
        applicationId = "com.example.mobile_app"
    }
}
`;

const IOS_PBXPROJ = [
  "PRODUCT_BUNDLE_IDENTIFIER = com.example.mobileApp;",
  "PRODUCT_BUNDLE_IDENTIFIER = com.example.mobileApp.RunnerTests;",
].join("\n");

const KOTLIN_MAIN_ACTIVITY = `package com.example.mobile_app

import io.flutter.embedding.android.FlutterActivity

class MainActivity : FlutterActivity()
`;

const PACKAGE_JSON = `{ "name": "super-template", "displayName": "Super Template" }
`;

/**
 * A minimal stand-in for the files a rebrand touches, plus the script itself.
 * @param {string} label unique suffix so parallel runs cannot collide
 */
function makeFixture(label) {
  const root = join(tmpdir(), `super-template-rename-${label}-${process.pid}-${Date.now()}`);
  temporaryRoots.push(root);

  mkdirSync(join(root, "scripts"), { recursive: true });
  cpSync(join(repoRoot, "scripts/rename.mjs"), join(root, "scripts/rename.mjs"));
  cpSync(join(repoRoot, "scripts/merge-env.mjs"), join(root, "scripts/merge-env.mjs"));

  const files = {
    "package.json": PACKAGE_JSON,
    "android/app/build.gradle.kts": ANDROID_GRADLE,
    "ios/Runner.xcodeproj/project.pbxproj": IOS_PBXPROJ,
    "android/app/src/main/kotlin/com/example/mobile_app/MainActivity.kt": KOTLIN_MAIN_ACTIVITY,
  };
  for (const [relativePath, contents] of Object.entries(files)) {
    const absolute = join(root, relativePath);
    mkdirSync(join(absolute, ".."), { recursive: true });
    writeFileSync(absolute, contents);
  }

  return root;
}

function runRename(root, args) {
  return spawnSync(process.execPath, [join(root, "scripts/rename.mjs"), ...args], {
    cwd: root,
    encoding: "utf8",
  });
}

const read = (root, relativePath) => readFileSync(join(root, relativePath), "utf8");

/** Every occurrence of the template's placeholder mobile identifiers. */
function placeholderAppIds(root) {
  const files = [
    "android/app/build.gradle.kts",
    "ios/Runner.xcodeproj/project.pbxproj",
    "android/app/src/main/kotlin/com/example/mobile_app/MainActivity.kt",
  ];
  return files.flatMap((file) =>
    read(root, file)
      .split("\n")
      .filter(
        (line) => line.includes("com.example.mobileApp") || line.includes("com.example.mobile_app"),
      )
      .map((line) => `${file}: ${line.trim()}`),
  );
}

after(() => {
  for (const root of temporaryRoots) rmSync(root, { recursive: true, force: true });
});

test("rewrites both platform identifiers to com.<name>.app", () => {
  const root = makeFixture("app-id");
  const result = runRename(root, ["Acme App", "--author", "acme-co"]);
  assert.equal(result.status, 0, result.stderr);

  assert.deepEqual(placeholderAppIds(root), []);

  const gradle = read(root, "android/app/build.gradle.kts");
  assert.match(gradle, /namespace = "com\.acmeapp\.app"/);
  assert.match(gradle, /applicationId = "com\.acmeapp\.app"/);

  const pbxproj = read(root, "ios/Runner.xcodeproj/project.pbxproj");
  assert.match(pbxproj, /PRODUCT_BUNDLE_IDENTIFIER = com\.acmeapp\.app;/);
  // The test target keeps its suffix: the prefix rule has to carry it along.
  assert.match(pbxproj, /PRODUCT_BUNDLE_IDENTIFIER = com\.acmeapp\.app\.RunnerTests;/);

  assert.match(
    read(root, "android/app/src/main/kotlin/com/example/mobile_app/MainActivity.kt"),
    /^package com\.acmeapp\.app$/m,
  );
});

test("keeps rewriting the name casings it already handled", () => {
  const root = makeFixture("casings");
  const result = runRename(root, ["Acme App", "--author", "acme-co"]);
  assert.equal(result.status, 0, result.stderr);

  assert.equal(read(root, "package.json"), `{ "name": "acme-app", "displayName": "Acme App" }\n`);
});

test("derives a package-legal segment for names that need folding", () => {
  const cases = [
    // Hyphens, punctuation and spaces are dropped, not kept: a Java package
    // segment cannot contain a hyphen.
    ["Acme & Co", "com.acmeco.app"],
    // A segment cannot start with a digit.
    ["3D Viewer", "com.app3dviewer.app"],
    // Diacritics fold to ASCII instead of being dropped mid-word.
    ["Ứng Dụng Bán Hàng", "com.ungdungbanhang.app"],
  ];

  for (const [name, expected] of cases) {
    const root = makeFixture(encodeURIComponent(name).replace(/%/g, ""));
    const result = runRename(root, [name, "--author", "acme-co"]);
    assert.equal(result.status, 0, result.stderr);
    assert.match(
      read(root, "android/app/build.gradle.kts"),
      new RegExp(`applicationId = "${expected.replace(/\./g, "\\.")}"`),
      `${name} should map to ${expected}`,
    );
  }
});

test("--dry-run reports the new identifiers without writing", () => {
  const root = makeFixture("dry-run");
  const before = read(root, "android/app/build.gradle.kts");

  const result = runRename(root, ["Acme App", "--author", "acme-co", "--dry-run"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /com\.acmeapp\.app/);
  assert.equal(read(root, "android/app/build.gradle.kts"), before);
});
