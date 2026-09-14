/**
 * Domain-layer purity policy.
 *
 * ADR 0001 (`docs/adr/0001-domain-layer-criteria.md`) requires every `domain/`
 * directory of a feature package to be framework-free: the rules there are
 * plain functions over plain data, testable without a Nest container or a
 * database. Runtime coupling is what breaks that, so the rule is about **value**
 * imports:
 *
 *   - `import { Injectable } from "@nestjs/common"` — violation.
 *   - `import type { NestMiddleware } from "@nestjs/common"` — allowed; a type
 *     binding is erased at compile time and adds no runtime coupling.
 *   - `import { type A, type B } from "drizzle-orm"` — allowed, same reason.
 *   - `import { type A, B } from "drizzle-orm"` — violation; `B` is a value.
 *
 * `@repo/api-kernel` and `@repo/api-runtime` are deliberately **allowed**: the
 * kernel owns the framework-free error/port vocabulary that domain code builds
 * on (see ADR 0001).
 *
 * The scan is AST-based rather than regex-based so that string literals,
 * comments and multi-line import clauses cannot fake a pass. The pure
 * `findDomainPurityViolations` entry point is exercised by
 * `scripts/__tests__/domain-purity-policy.spec.mjs`.
 */
import ts from "typescript";

/**
 * Module specifiers a domain file may not import values from, exactly as
 * written in ADR 0001 rule 1. A trailing `/` marks a package prefix, so
 * `@nestjs/common` and `drizzle-orm/pg-core` both match.
 */
export const FORBIDDEN_DOMAIN_MODULES = Object.freeze([
  "@nestjs/",
  "drizzle-orm",
  "express",
  "@repo/database-runtime",
]);

/**
 * True when a module specifier is forbidden in domain code.
 *
 * @param {string} specifier
 * @returns {boolean}
 */
export function isForbiddenDomainSpecifier(specifier) {
  return FORBIDDEN_DOMAIN_MODULES.some((entry) =>
    entry.endsWith("/")
      ? specifier.startsWith(entry) || specifier === entry.slice(0, -1)
      : specifier === entry || specifier.startsWith(`${entry}/`),
  );
}

/**
 * True when every binding of an import/export clause is type-only, so the whole
 * statement is erased at compile time.
 *
 * @param {ts.ImportDeclaration | ts.ExportDeclaration} node
 * @returns {boolean}
 */
function clauseIsTypeOnly(node) {
  if (ts.isExportDeclaration(node)) {
    // `export type { X } from "…"` / `export type * from "…"`.
    if (node.isTypeOnly === true) return true;
    // `export * from "…"` / `export * as ns from "…"`.
    if (!node.exportClause || ts.isNamespaceExport(node.exportClause)) return false;
    return (
      node.exportClause.elements.length > 0 &&
      node.exportClause.elements.every((element) => element.isTypeOnly === true)
    );
  }
  const clause = node.importClause;
  // `import "@nestjs/common"` — a side-effect import.
  if (!clause) return false;
  // `import type { X } from "…"` / `import type x from "…"`.
  if (clause.isTypeOnly === true) return true;
  const bindings = clause.namedBindings;
  // `import x from "…"`.
  if (!bindings) return false;
  // `import * as x from "…"`.
  if (ts.isNamespaceImport(bindings)) return false;
  return (
    bindings.elements.length > 0 &&
    bindings.elements.every((element) => element.isTypeOnly === true)
  );
}

/**
 * Collect the domain-purity violations of a single TypeScript source text.
 *
 * @param {string} file Repository-relative path, used for reporting.
 * @param {string} sourceText
 * @returns {{ file: string, line: number, column: number, specifier: string, kind: string }[]}
 */
export function findDomainPurityViolations(file, sourceText) {
  const sourceFile = ts.createSourceFile(
    file,
    sourceText,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TS,
  );
  /** @type {{ file: string, line: number, column: number, specifier: string, kind: string }[]} */
  const violations = [];

  const report = (node, specifier, kind) => {
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    violations.push({ file, line: line + 1, column: character + 1, specifier, kind });
  };

  const checkSpecifier = (node, specifier, kind) => {
    if (!isForbiddenDomainSpecifier(specifier)) return;
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && clauseIsTypeOnly(node)) {
      return;
    }
    report(node, specifier, kind);
  };

  const visit = (node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      checkSpecifier(
        node,
        node.moduleSpecifier.text,
        ts.isImportDeclaration(node) ? "value import" : "value re-export",
      );
    } else if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference) &&
      node.moduleReference.expression &&
      ts.isStringLiteral(node.moduleReference.expression)
    ) {
      // `import x = require("@nestjs/common")` — always a value binding.
      checkSpecifier(node, node.moduleReference.expression.text, "require import");
    } else if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === "require")) &&
      node.arguments.length > 0 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      // Dynamic `import("…")` / `require("…")` — a runtime load.
      checkSpecifier(node, node.arguments[0].text, "dynamic import");
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  return violations;
}
