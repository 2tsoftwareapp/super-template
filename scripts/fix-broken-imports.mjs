#!/usr/bin/env node
/**
 * Fix broken import statements where the migration script inserted
 * feature-specific imports in the middle of multi-line import statements.
 *
 * Pattern: an import statement like
 *   import {
 *   import { AUDIT_WRITER } from "@repo/feature-audit/contracts";
 *   import type { AuditWriter } from "@repo/feature-audit/contracts";
 *     FOO,
 *   } from "somewhere";
 *
 * Should become:
 *   import { AUDIT_WRITER } from "@repo/feature-audit/contracts";
 *   import type { AuditWriter } from "@repo/feature-audit/contracts";
 *   import {
 *     FOO,
 *   } from "somewhere";
 */
import { readFileSync, writeFileSync, globSync } from "node:fs";
import { resolve } from "node:path";

const tsFiles = [];
for (const pattern of ["packages/*/src/**/*.ts", "apps/*/src/**/*.ts"]) {
  for (const f of globSync(pattern, { cwd: resolve(".") })) {
    if (f.includes("node_modules")) continue;
    tsFiles.push(resolve(f));
  }
}

let totalFixed = 0;

for (const filePath of tsFiles) {
  const content = readFileSync(filePath, "utf8");

  // Pattern: import {\nimport { FEATURE } from "...";\nimport type { ... } from "...";\n  REST_OF_IMPORT\n} from "...";
  // This means we have feature imports sandwiched inside a multi-line import
  const brokenPattern =
    /(import \{\n)(import \{[^}]+\} from "[^"]+";\nimport type \{[^}]+\} from "[^"]+";\n)(\s+\S[\s\S]*?\} from "[^"]+";)/;

  const match = brokenPattern.exec(content);
  if (match) {
    const featureImportLines = match[2].trim();
    const restoredImport = `import {\n${match[3]}`;

    const fixed = content.replace(
      brokenPattern,
      `${featureImportLines}\n\n${restoredImport}`,
    );

    if (fixed !== content) {
      writeFileSync(filePath, fixed, "utf8");
      totalFixed++;
      console.log(`Fixed: ${filePath.replace(resolve(".") + "/", "")}`);
    }
  }
}

console.log(`\nTotal files fixed: ${totalFixed}`);
