/**
 * Cross-feature foreign-key structural validator.
 *
 * Walks the abstract syntax tree of a Drizzle schema file, locates the column
 * declaration of interest and verifies, exactly:
 *
 *   - the source property name,
 *   - the physical column name,
 *   - presence of `.references(() => targetTableExport.targetProperty, { onDelete: ... })`,
 *   - the referenced table export resolves to the expected source file and
 *     exports the same property name,
 *   - required nullability (.notNull() / .primaryKey() / no .notNull() chain),
 *   - exact `onDelete` literal,
 *   - the chain is attached to the requested column definition (not some
 *     other table declaration in the same file).
 *
 * No regex matching of the source text. No fall-through counts. Each check
 * either matches exactly one column declaration or fails.
 *
 * The validator is exported in pure form so regression tests can pass
 * arbitrary source text through it without mutating tracked files.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import ts from "typescript";

/** @typedef {{
 *   onDelete: "cascade" | "set null" | "restrict" | "no action",
 * }} OnDeleteSpec
 */

/**
 * @typedef {{
 *   sourceFile: string,
 *   sourceTableExport: string,
 *   propertyName: string,
 *   physicalColumnName: string,
 *   targetFile: string,
 *   targetTableExport: string,
 *   targetPropertyName: string,
 *   nullable: boolean,
 *   onDelete: "cascade" | "set null" | "restrict" | "no action",
 * }} FkCheck
 */

/**
 * @typedef {{
 *   file: string,
 *   property: string,
 *   reason: string,
 *   expected?: Partial<FkCheck>,
 * }} FkFailure
 */

/**
 * Validate a single source file against the supplied checks. Pure function:
 * accepts the source text, the file path (for resolution context), and the
 * list of checks to verify. Returns the list of failures (empty if all pass).
 *
 * @param {string} file
 * @param {string} sourceText
 * @param {readonly FkCheck[]} checks
 * @param {(exportName: string) => string | undefined} resolveImport
 *   Maps a target export name to the file path that declares it. Used to
 *   verify the target table is imported from the expected file.
 * @returns {FkFailure[]}
 */
export function validateForeignKeys(file, sourceText, checks, resolveImport) {
  const sourceFile = ts.createSourceFile(
    file,
    sourceText,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TS,
  );
  /** @type {FkFailure[]} */
  const failures = [];
  const seenKeys = new Set();
  const requiredFields = [
    "sourceFile",
    "sourceTableExport",
    "propertyName",
    "physicalColumnName",
    "targetFile",
    "targetTableExport",
    "targetPropertyName",
    "nullable",
    "onDelete",
  ];
  for (const check of checks) {
    const missing = requiredFields.filter((field) => check[field] === undefined);
    if (missing.length > 0) {
      failures.push({
        file,
        property: check.propertyName ?? "(unknown)",
        reason: `missing required FK specification field(s): ${missing.join(", ")}.`,
        expected: check,
      });
      continue;
    }
    const key = `${check.sourceFile}+${check.sourceTableExport}+${check.propertyName}`;
    if (seenKeys.has(key)) {
      failures.push({
        file,
        property: check.propertyName,
        reason: `duplicate FK specification key: ${key}.`,
        expected: check,
      });
      continue;
    }
    seenKeys.add(key);
    const sourceTableExport = check.sourceTableExport;
    const table = findExportedPgTable(sourceFile, sourceTableExport);
    if (!table) {
      failures.push({
        file,
        property: check.propertyName,
        reason: `source table "${sourceTableExport}" is not an exported pgTable.`,
        expected: check,
      });
      continue;
    }
    const columns = table.arguments[1];
    const decl =
      columns && ts.isObjectLiteralExpression(columns)
        ? columns.properties.find(
            (p) =>
              ts.isPropertyAssignment(p) &&
              ts.isIdentifier(p.name) &&
              p.name.text === check.propertyName,
          )
        : undefined;
    if (!decl || !ts.isPropertyAssignment(decl)) {
      failures.push({
        file,
        property: check.propertyName,
        reason: `expected property "${check.propertyName}" in table "${sourceTableExport}" was not found.`,
        expected: check,
      });
      continue;
    }
    const fail = checkColumnDeclaration(file, decl, check, resolveImport);
    if (fail) failures.push(fail);
  }
  return failures;
}

function findExportedPgTable(sourceFile, exportName) {
  for (const statement of sourceFile.statements) {
    if (
      !ts.isVariableStatement(statement) ||
      !statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    )
      continue;
    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === exportName &&
        ts.isCallExpression(declaration.initializer) &&
        ts.isIdentifier(declaration.initializer.expression) &&
        declaration.initializer.expression.text === "pgTable"
      )
        return declaration.initializer;
    }
  }
  return undefined;
}

/**
 * @param {ts.SourceFile} sourceFile
 * @param {string} property
 * @returns {ts.PropertyAssignment[]}
 */
function collectColumnDeclarations(sourceFile, property) {
  /** @type {ts.PropertyAssignment[]} */
  const out = [];
  const visit = (node) => {
    if (
      ts.isPropertyAssignment(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === property
    ) {
      out.push(node);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return out;
}

/**
 * @param {string} file
 * @param {ts.PropertyAssignment} decl
 * @param {FkCheck} check
 * @param {(exportName: string) => string | undefined} resolveImport
 * @returns {FkFailure | null}
 */
function checkColumnDeclaration(file, decl, check, resolveImport) {
  const targetTableExport = check.targetTableExport;
  const initializer = decl.initializer;
  if (!initializer || !ts.isCallExpression(initializer)) {
    return {
      file,
      property: check.propertyName,
      reason: `${check.propertyName}: initializer is not a call expression (uuid(...)).`,
      expected: check,
    };
  }
  // Walk the call chain outward to find the outermost call. The chain can be:
  //   prop: uuid("...").notNull().references(...)
  //   prop: uuid("...").references(...)
  //   prop: uuid("...").notNull()
  let outermost = initializer;
  while (outermost.parent && ts.isCallExpression(outermost.parent)) {
    outermost = outermost.parent;
  }
  const chain = readChain(outermost);
  // Find the uuid("<column>") call. Its expression is a plain Identifier.
  const uuidEntry = chain.findLast((c) => ts.isIdentifier(c.expr));
  if (!uuidEntry) {
    return {
      file,
      property: check.propertyName,
      reason: `${check.propertyName}: no uuid(...) call found in chain.`,
      expected: check,
    };
  }
  const physicalColumn = extractUuidStringLiteralFromArgs(uuidEntry.args);
  if (physicalColumn !== check.physicalColumnName) {
    return {
      file,
      property: check.propertyName,
      reason:
        `${check.propertyName}: physical column name expected "${check.physicalColumnName}", ` +
        `found "${physicalColumn ?? "(missing)"}".`,
      expected: check,
    };
  }
  const notNullOrPk = chain.find(
    (c) =>
      ts.isPropertyAccessExpression(c.expr) &&
      (c.expr.name.text === "notNull" || c.expr.name.text === "primaryKey"),
  );
  const isNotNull = Boolean(notNullOrPk);
  if (isNotNull !== !check.nullable) {
    return {
      file,
      property: check.propertyName,
      reason:
        `${file} ${check.propertyName}: expected nullable=${check.nullable}, ` +
        `column is ${isNotNull ? "notNull" : "nullable"} (chain has ` +
        `${notNullOrPk ? `.${notNullOrPk.expr.name.text}` : "no notNull/primaryKey"}).`,
      expected: check,
    };
  }
  const referencesCall = chain.find(
    (c) => ts.isPropertyAccessExpression(c.expr) && c.expr.name.text === "references",
  );
  if (!referencesCall) {
    return {
      file,
      property: check.propertyName,
      reason: `${check.propertyName}: missing .references(() => ${targetTableExport}.${check.targetPropertyName}, { onDelete: "${check.onDelete}" }) chain.`,
      expected: check,
    };
  }
  const args = referencesCall.args;
  if (args.length === 0) {
    return {
      file,
      property: check.propertyName,
      reason: `${check.propertyName}: .references() has no argument.`,
      expected: check,
    };
  }
  // First argument: () => targetTableExport.targetProperty
  const arrow = args[0];
  if (!arrow || !ts.isArrowFunction(arrow)) {
    return {
      file,
      property: check.propertyName,
      reason: `${check.propertyName}: .references() first argument is not an arrow function.`,
      expected: check,
    };
  }
  const body = arrow.body;
  if (!ts.isPropertyAccessExpression(body)) {
    return {
      file,
      property: check.propertyName,
      reason: `${check.propertyName}: .references() arrow body is not a property access.`,
      expected: check,
    };
  }
  if (!ts.isIdentifier(body.expression) || body.expression.text !== targetTableExport) {
    return {
      file,
      property: check.propertyName,
      reason:
        `${check.propertyName}: .references() target table expected "${targetTableExport}", ` +
        `found "${ts.isIdentifier(body.expression) ? body.expression.text : "(not an identifier)"}".`,
      expected: check,
    };
  }
  if (body.name.text !== check.targetPropertyName) {
    return {
      file,
      property: check.propertyName,
      reason:
        `${check.propertyName}: .references() target property expected "${check.targetPropertyName}", ` +
        `found "${body.name.text}".`,
      expected: check,
    };
  }
  // Second argument: { onDelete: "<value>" }
  const optionsArg = args[1];
  if (!optionsArg || !ts.isObjectLiteralExpression(optionsArg)) {
    return {
      file,
      property: check.propertyName,
      reason: `${check.propertyName}: .references() missing options object { onDelete: "${check.onDelete}" }.`,
      expected: check,
    };
  }
  const onDeleteProp = optionsArg.properties.find(
    (p) => ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === "onDelete",
  );
  if (!onDeleteProp || !ts.isPropertyAssignment(onDeleteProp)) {
    return {
      file,
      property: check.propertyName,
      reason: `${check.propertyName}: options object missing onDelete property.`,
      expected: check,
    };
  }
  const onDeleteValue = onDeleteProp.initializer;
  if (!ts.isStringLiteral(onDeleteValue) || onDeleteValue.text !== check.onDelete) {
    return {
      file,
      property: check.propertyName,
      reason:
        `${check.propertyName}: onDelete expected "${check.onDelete}", ` +
        `found "${ts.isStringLiteral(onDeleteValue) ? onDeleteValue.text : "(not a string literal)"}".`,
      expected: check,
    };
  }
  // Verify the import path resolves to the expected target file. Both sides
  // are normalized to forward-slash absolute paths without the `.ts`
  // extension before comparison.
  const resolved = resolveImport(targetTableExport);
  if (!resolved) {
    return {
      file,
      property: check.propertyName,
      reason: `${check.propertyName}: target import for "${targetTableExport}" cannot be resolved.`,
      expected: check,
    };
  }
  {
    const normalize = (p) => p.replace(/\\/g, "/").replace(/\.ts$/, "");
    // If the caller supplied a relative targetFile (e.g. "packages/..."),
    // resolve it against the current working directory. The validator is
    // invoked from the repository root by all scripts.
    let expected = check.targetFile;
    if (!expected.startsWith("/")) {
      expected = resolve(process.cwd(), expected);
    }
    if (normalize(resolved) !== normalize(expected)) {
      return {
        file,
        property: check.propertyName,
        reason:
          `${check.propertyName}: target table "${targetTableExport}" resolved to ${resolved}, ` +
          `expected ${check.targetFile}.`,
        expected: check,
      };
    }
  }
  return null;
}

/**
 * Read the call chain starting from the outermost call (the last `.x()` in
 * the column declaration) and return an array of {expr, args} for each
 * chained call walking inward, plus the root call. The first element is the
 * outermost chained call (e.g. `.references()`) and the last is `uuid(...)`.
 *
 * @param {ts.CallExpression} outermost
 * @returns {{ expr: ts.LeftHandSideExpression, args: readonly ts.Expression[] }[]}
 */
function readChain(outermost) {
  /** @type {{ expr: ts.LeftHandSideExpression, args: readonly ts.Expression[] }[]} */
  const out = [];
  /** @type {ts.CallExpression | null} */
  let current = outermost;
  while (current) {
    out.push({
      expr: /** @type {ts.LeftHandSideExpression} */ (current.expression),
      args: current.arguments,
    });
    const expr = current.expression;
    if (ts.isCallExpression(expr)) {
      current = expr;
    } else if (ts.isPropertyAccessExpression(expr)) {
      const inner = expr.expression;
      if (ts.isCallExpression(inner)) {
        current = inner;
      } else {
        break;
      }
    } else {
      break;
    }
  }
  return out;
}

/**
 * @param {readonly ts.Expression[]} args
 * @returns {string | null}
 */
function extractUuidStringLiteralFromArgs(args) {
  const arg = args[0];
  if (!arg || !ts.isStringLiteral(arg)) return null;
  return arg.text;
}

/**
 * Walk a resolved file to find the actual source path that exports the
 * requested symbol. Handles a chain of `export { x } from "./y"` re-exports.
 *
 * @param {string} resolved
 * @param {string} name
 * @param {Set<string>} seen
 * @returns {string | undefined}
 */
function followReExports(resolved, name, seen) {
  if (seen.has(resolved)) return undefined;
  seen.add(resolved);
  if (!existsSync(resolved)) return undefined;
  const text = readFileSync(resolved, "utf8");
  const sourceFile = ts.createSourceFile(
    resolved,
    text,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TS,
  );
  /** @type {string | undefined} */
  let directExport;
  for (const stmt of sourceFile.statements) {
    // `export const users = ...` / `export function users` / `export class users`
    if (
      ts.isVariableStatement(stmt) ||
      ts.isFunctionDeclaration(stmt) ||
      ts.isClassDeclaration(stmt)
    ) {
      const decl =
        (ts.isVariableStatement(stmt) && stmt.declarationList.declarations[0]) ||
        (ts.isFunctionDeclaration(stmt) && stmt) ||
        (ts.isClassDeclaration(stmt) && stmt);
      if (decl && ts.isIdentifier(decl.name) && decl.name.text === name) {
        directExport = resolved;
      }
    }
    // `export { name }` (no module specifier)
    if (ts.isExportDeclaration(stmt) && !stmt.moduleSpecifier) {
      if (stmt.exportClause && ts.isNamedExports(stmt.exportClause)) {
        for (const el of stmt.exportClause.elements) {
          const localName = el.propertyName?.text ?? el.name.text;
          if (localName === name) {
            directExport = resolved;
          }
        }
      }
    }
  }
  if (directExport) return directExport;
  // Look for `export ... from "..."` re-exports
  for (const stmt of sourceFile.statements) {
    if (
      ts.isExportDeclaration(stmt) &&
      stmt.moduleSpecifier &&
      ts.isStringLiteral(stmt.moduleSpecifier) &&
      stmt.exportClause &&
      ts.isNamedExports(stmt.exportClause)
    ) {
      for (const el of stmt.exportClause.elements) {
        const localName = el.propertyName?.text ?? el.name.text;
        if (localName === name) {
          const base = dirname(resolved);
          const next = resolve(base, stmt.moduleSpecifier.text);
          const candidates = [next + ".ts", resolve(next, "index.ts"), next];
          for (const c of candidates) {
            if (existsSync(c)) {
              const followed = followReExports(c, el.name.text, seen);
              if (followed) return followed;
            }
          }
        }
      }
    }
  }
  return undefined;
}

/**
 * Default import resolver: scans the source file for top-level import
 * declarations, follows re-exports through the public entrypoint, and returns
 * the file path that exports a given symbol.
 *
 * @param {string} file
 * @param {string} sourceText
 * @returns {(name: string) => string | undefined}
 */
export function buildImportResolver(file, sourceText) {
  const sourceFile = ts.createSourceFile(
    file,
    sourceText,
    ts.ScriptTarget.ESNext,
    /* setParentNodes */ true,
    ts.ScriptKind.TS,
  );
  /** @type {Map<string, string>} exportName -> source specifier */
  const importMap = new Map();
  /** @type {string[]} */
  const reExports = [];
  for (const stmt of sourceFile.statements) {
    if (
      ts.isImportDeclaration(stmt) &&
      stmt.moduleSpecifier &&
      ts.isStringLiteral(stmt.moduleSpecifier)
    ) {
      const spec = stmt.moduleSpecifier.text;
      const clause = stmt.importClause;
      if (clause) {
        if (clause.name) {
          importMap.set(clause.name.text, spec);
        }
        if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
          for (const el of clause.namedBindings.elements) {
            importMap.set(el.name.text, spec);
          }
        }
      }
    }
    if (ts.isExportDeclaration(stmt)) {
      if (stmt.moduleSpecifier && ts.isStringLiteral(stmt.moduleSpecifier)) {
        reExports.push(stmt.moduleSpecifier.text);
      }
    }
  }
  /** @type {Map<string, string>} */
  const resolved = new Map();
  for (const stmt of sourceFile.statements) {
    if (
      ts.isVariableStatement(stmt) &&
      stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      for (const declaration of stmt.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) resolved.set(declaration.name.text, file);
      }
    }
  }
  const repoRoot = process.cwd();
  const resolveSpec = (spec) => {
    if (spec.startsWith("@repo/")) {
      const parts = spec.split("/");
      const pkg = parts.slice(0, 2).join("/");
      const sub = parts.slice(2).join("/");
      // Resolve the repo root by walking up from the source file looking for
      // a directory that contains `packages/`.
      let dir = dirname(resolve(repoRoot, file));
      let repoRootResolved = repoRoot;
      for (let i = 0; i < 8; i += 1) {
        if (existsSync(resolve(dir, "packages"))) {
          repoRootResolved = dir;
          break;
        }
        const parent = dirname(dir);
        if (parent === dir) break;
        dir = parent;
      }
      const pkgDir = resolve(repoRootResolved, "packages", pkg.replace("@repo/", ""));
      // For subpath exports: try `<pkgDir>/src/<sub>` first, then resolve via
      // package.json exports.
      const tryPaths = sub
        ? [
            resolve(pkgDir, "src", `${sub}.ts`),
            resolve(pkgDir, "src", sub, "index.ts"),
            resolve(pkgDir, sub),
            resolve(pkgDir, `${sub}.ts`),
          ]
        : [resolve(pkgDir, "src/index.ts")];
      for (const p of tryPaths) {
        if (existsSync(p)) return p;
      }
      // Read the package.json exports map for a more authoritative mapping.
      const pkgJson = resolve(pkgDir, "package.json");
      if (existsSync(pkgJson)) {
        try {
          const pkgData = JSON.parse(readFileSync(pkgJson, "utf8"));
          const exportsMap = pkgData.exports ?? {};
          const key = sub ? `./${sub}` : ".";
          const target = exportsMap[key];
          if (typeof target === "string") {
            return resolve(pkgDir, target);
          }
        } catch (error) {
          throw new Error(
            `Cannot parse package exports at ${pkgJson}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
      return undefined;
    }
    const base = dirname(resolve(repoRoot, file));
    const abs = resolve(base, spec);
    if (existsSync(abs + ".ts")) return abs + ".ts";
    if (existsSync(abs + "/index.ts")) return abs + "/index.ts";
    return abs;
  };
  for (const [name, spec] of importMap) {
    resolved.set(name, resolveSpec(spec));
  }
  for (const spec of reExports) {
    const abs = resolveSpec(spec);
    if (existsSync(abs)) {
      const text = readFileSync(abs, "utf8");
      const sub = ts.createSourceFile(abs, text, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);
      for (const stmt of sub.statements) {
        if (ts.isExportDeclaration(stmt) && !stmt.moduleSpecifier) {
          if (stmt.exportClause && ts.isNamedExports(stmt.exportClause)) {
            for (const el of stmt.exportClause.elements) {
              if (el.propertyName && el.name) {
                resolved.set(el.propertyName.text, abs);
              } else if (el.name) {
                resolved.set(el.name.text, abs);
              }
            }
          }
        }
      }
    }
  }
  return (name) => {
    const initial = resolved.get(name);
    if (!initial) return undefined;
    return followReExports(initial, name, new Set());
  };
}
