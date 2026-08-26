#!/usr/bin/env node
/**
 * Migrate feature-specific port imports from @repo/api-runtime to owning
 * feature package contracts.
 *
 * Handles the case where a single import statement mixes symbols from
 * api-runtime with symbols that should come from a feature contract.
 *
 * Run from repo root:  node scripts/fix-imports.mjs
 */
import { readFileSync, writeFileSync, globSync } from "node:fs";
import { resolve } from "node:path";

// Symbol → owning feature contract import path
const SYMBOL_TO_FEATURE = new Map([
  // Audit
  ["AUDIT_WRITER", "@repo/feature-audit/contracts"],
  ["AuditWriter", "@repo/feature-audit/contracts"],
  ["AuditLogInput", "@repo/feature-audit/contracts"],
  ["AuditLogBaseInput", "@repo/feature-audit/contracts"],
  // Jobs
  ["BACKGROUND_JOB_ENQUEUER", "@repo/feature-jobs/contracts"],
  ["BACKGROUND_JOB_ENQUEUER_WITH_RESULT", "@repo/feature-jobs/contracts"],
  ["BackgroundJobEnqueuer", "@repo/feature-jobs/contracts"],
  ["BackgroundJobEnqueuerWithResult", "@repo/feature-jobs/contracts"],
  ["BackgroundJobEnqueueInput", "@repo/feature-jobs/contracts"],
  ["BackgroundJobRef", "@repo/feature-jobs/contracts"],
  // Upload
  ["FILE_LOOKUP", "@repo/feature-upload/contracts"],
  ["FileLookup", "@repo/feature-upload/contracts"],
  ["FileOwnerRecord", "@repo/feature-upload/contracts"],
  // Mail
  ["MAIL_TEMPLATE_SENDER", "@repo/feature-mail/contracts"],
  ["MailTemplateSender", "@repo/feature-mail/contracts"],
  ["MailTemplateSendInput", "@repo/feature-mail/contracts"],
  // Notifications
  ["USER_NOTIFICATION_SENDER", "@repo/feature-notifications/contracts"],
  ["UserNotificationSender", "@repo/feature-notifications/contracts"],
  ["SendUserNotificationInput", "@repo/feature-notifications/contracts"],
  ["NotificationMessage", "@repo/feature-notifications/contracts"],
  // Import-Export
  ["IMPORT_EXPORT_ADAPTER", "@repo/feature-import-export/contracts"],
  ["ImportExportAdapter", "@repo/feature-import-export/contracts"],
  ["ImportExportRowContext", "@repo/feature-import-export/contracts"],
  ["ImportValidationError", "@repo/feature-import-export/contracts"],
]);

const RUNTIME_RE = /@repo\/api-(?:runtime|kernel)/;

function processFile(filePath) {
  let content = readFileSync(filePath, "utf8");
  const original = content;

  // Match import statements: import { ... } from "@repo/api-runtime"
  // or import type { ... } from "@repo/api-runtime"
  const importRe = /^(import\s+)(type\s+)?(\{[^}]+\})\s+(from\s+"@repo\/api-(?:runtime|kernel)";?)$/gm;

  let newContent = content;
  const featureImports = {}; // feature → { values: [], types: [] }

  newContent = newContent.replace(importRe, (fullMatch, prefix, typeKw, symbolsStr, fromSuffix) => {
    const isTypeOnly = !!typeKw;
    const symbols = symbolsStr
      .replace(/[{}]/g, "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const keepSymbols = [];
    const migrateSymbols = []; // { name, isType }

    for (const sym of symbols) {
      // Parse "type Foo" vs "Foo"
      const typePrefix = sym.startsWith("type ") ? "type " : "";
      const name = sym.replace(/^type\s+/, "").trim();
      const feature = SYMBOL_TO_FEATURE.get(name);

      if (feature) {
        migrateSymbols.push({ name, isType: isTypeOnly || !!typePrefix, feature });
      } else {
        keepSymbols.push(sym);
      }
    }

    // Migrate: group by feature
    for (const ms of migrateSymbols) {
      if (!featureImports[ms.feature]) featureImports[ms.feature] = { values: [], types: [] };
      if (ms.isType) {
        featureImports[ms.feature].types.push(ms.name);
      } else {
        featureImports[ms.feature].values.push(ms.name);
      }
    }

    // Rebuild original import if anything remains
    if (keepSymbols.length === 0) {
      return ""; // entire import removed
    }
    const rebuiltSymbols = keepSymbols.join(", ");
    return `${prefix}${typeKw || ""}{ ${rebuiltSymbols} } ${fromSuffix}`;
  });

  // Build new import lines for feature contracts
  const newLines = [];
  for (const [feature, { values, types }] of Object.entries(featureImports)) {
    // Deduplicate
    const uniqueValues = [...new Set(values)];
    const uniqueTypes = [...new Set(types)];

    if (uniqueValues.length > 0) {
      newLines.push(`import { ${uniqueValues.join(", ")} } from "${feature}";`);
    }
    if (uniqueTypes.length > 0) {
      newLines.push(`import type { ${uniqueTypes.join(", ")} } from "${feature}";`);
    }
  }

  if (newLines.length === 0) return; // nothing to migrate

  // Insert new imports after the last existing import
  const lines = newContent.split("\n");
  let lastImportLine = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^import\s/.test(lines[i])) {
      lastImportLine = i;
    }
  }

  if (lastImportLine >= 0) {
    lines.splice(lastImportLine + 1, 0, ...newLines);
  } else {
    // No existing imports - insert at top
    lines.unshift(...newLines, "");
  }

  newContent = lines.join("\n");

  // Clean up empty import lines and double blank lines
  newContent = newContent.replace(/^import\s+\{\s*\}\s+from\s+"[^"]+";\s*\n/gm, "");
  newContent = newContent.replace(/\n{3,}/g, "\n\n");

  if (newContent !== original) {
    writeFileSync(filePath, newContent, "utf8");
    return true;
  }
  return false;
}

// Collect all .ts files
const tsFiles = [];
for (const pattern of ["packages/*/src/**/*.ts", "apps/*/src/**/*.ts"]) {
  for (const f of globSync(pattern, { cwd: resolve(".") })) {
    if (f.includes("node_modules") || f.includes(".spec.") || f.includes(".test.")) continue;
    tsFiles.push(resolve(f));
  }
}

let totalChanged = 0;
for (const filePath of tsFiles) {
  if (processFile(filePath)) {
    totalChanged++;
    console.log(`  Updated: ${filePath.replace(resolve(".") + "/", "")}`);
  }
}

console.log(`\nTotal files updated: ${totalChanged}`);
