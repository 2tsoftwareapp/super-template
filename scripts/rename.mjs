#!/usr/bin/env node
/**
 * Rebrands this template for a new project.
 *
 * Replaces every casing of the template name and the original author/repo across
 * all git-tracked text files (lockfiles and binaries excluded):
 *
 *   super-template   (kebab)   -> <kebab>          package names, URLs, docker
 *   super_template   (snake)   -> <snake>          Dart package, generated client
 *   SuperTemplate    (Pascal)  -> <Pascal>         Dart class, OTP issuer
 *   Super Template   (Title)   -> <Title>          UI display strings
 *   truongnat        (author)  -> <author>         repo owner in URLs / badge
 *
 * The generated Dart client under apps/mobile/lib/generated/ is rewritten too so
 * the tree is consistent immediately; `pnpm generate` reproduces it deterministically.
 *
 * Usage:
 *   node scripts/rename.mjs "Acme App" --author acme-co
 *   node scripts/rename.mjs "Acme App" --author acme-co --dry-run
 *   node scripts/rename.mjs            # interactive prompts
 */
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve, relative, extname } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { repoRoot } from './merge-env.mjs';

const SELF = relative(repoRoot, resolve(import.meta.dirname, 'rename.mjs'));

// Tokens to replace, ordered so the standalone author swap runs after URL paths.
const OLD = {
  kebab: 'super-template',
  snake: 'super_template',
  pascal: 'SuperTemplate',
  title: 'Super Template',
  author: 'truongnat',
};

const BINARY_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.svg',
  '.woff', '.woff2', '.ttf', '.otf', '.eot',
  '.pdf', '.mp4', '.mov', '.zip', '.gz', '.jar', '.keystore',
]);

const SKIP_FILES = new Set([
  SELF,
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock',
]);

const parseArgs = (argv) => {
  const args = { _: [], author: undefined, dryRun: false, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '-h' || a === '--help') args.help = true;
    else if (a === '--author') { args.author = argv[i + 1]; i += 1; }
    else args._.push(a);
  }
  return args;
};

const HELP = `Rebrand this template for a new project.

Usage:
  node scripts/rename.mjs "<Project Name>" [--author <handle>] [--dry-run]

Arguments:
  <Project Name>   Free-form name; all casings are derived from it.

Options:
  --author <handle>  GitHub owner/handle replacing "${OLD.author}" in URLs/badge.
  --dry-run          Show what would change without writing anything.
  -h, --help         Show this help.
`;

/** Split a free-form name into lowercase word tokens. */
const words = (name) =>
  name
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase());

const toKebab = (name) => words(name).join('-');
const toSnake = (name) => words(name).join('_');
const toTitle = (name) => words(name).map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
const toPascal = (name) => words(name).map((w) => w[0].toUpperCase() + w.slice(1)).join('');

/** Escape a string for use as a literal RegExp. */
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    stdout.write(HELP);
    return;
  }

  let projectName = args._[0];
  let author = args.author;

  if (!projectName || !author) {
    const rl = createInterface({ input: stdin, output: stdout });
    try {
      if (!projectName) projectName = (await rl.question('Project name (e.g. "Acme App"): ')).trim();
      if (!author) author = (await rl.question(`GitHub owner/handle [your-org]: `)).trim();
    } finally {
      rl.close();
    }
  }

  if (!projectName) {
    stderr('A project name is required.');
    process.exit(1);
  }
  author = author || 'your-org';

  const NEW = {
    kebab: toKebab(projectName),
    snake: toSnake(projectName),
    pascal: toPascal(projectName),
    title: toTitle(projectName),
    author,
  };

  if (!NEW.kebab) {
    stderr(`Could not derive a valid identifier from "${projectName}".`);
    process.exit(1);
  }

  // Build replacement rules in apply order (URL-bearing casings before author).
  const rules = [
    [OLD.snake, NEW.snake],
    [OLD.kebab, NEW.kebab],
    [OLD.pascal, NEW.pascal],
    [OLD.title, NEW.title],
    [OLD.author, NEW.author],
  ].map(([from, to]) => [new RegExp(escape(from), 'g'), to, from]);

  stdout.write(`\nRebranding -> ${NEW.title}\n`);
  stdout.write(`  kebab:  ${OLD.kebab}  ->  ${NEW.kebab}\n`);
  stdout.write(`  snake:  ${OLD.snake}  ->  ${NEW.snake}\n`);
  stdout.write(`  pascal: ${OLD.pascal}   ->  ${NEW.pascal}\n`);
  stdout.write(`  title:  ${OLD.title}    ->  ${NEW.title}\n`);
  stdout.write(`  author: ${OLD.author}      ->  ${NEW.author}\n`);
  stdout.write(args.dryRun ? `\n[dry-run] no files will be written\n\n` : `\n`);

  const tracked = execSync('git ls-files', { cwd: repoRoot, encoding: 'utf8' })
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  let totalOccurrences = 0;
  const changedFiles = [];

  for (const rel of tracked) {
    if (SKIP_FILES.has(rel)) continue;
    if (BINARY_EXT.has(extname(rel).toLowerCase())) continue;

    const abs = resolve(repoRoot, rel);
    if (!existsSync(abs) || !statSync(abs).isFile()) continue;

    let content;
    try {
      content = readFileSync(abs, 'utf8');
    } catch {
      continue; // unreadable / binary
    }
    if (content.includes("\u0000")) continue; // binary guard (NUL byte)

    let updated = content;
    let fileCount = 0;
    for (const [pattern, to] of rules) {
      updated = updated.replace(pattern, () => {
        fileCount += 1;
        return to;
      });
    }

    if (fileCount > 0) {
      totalOccurrences += fileCount;
      changedFiles.push([rel, fileCount]);
      if (!args.dryRun) writeFileSync(abs, updated);
    }
  }

  changedFiles.sort((a, b) => b[1] - a[1]);
  for (const [rel, count] of changedFiles) {
    stdout.write(`  ${String(count).padStart(4)}  ${rel}\n`);
  }

  const verb = args.dryRun ? 'would change' : 'changed';
  stdout.write(
    `\n${verb} ${totalOccurrences} occurrence(s) across ${changedFiles.length} file(s).\n`,
  );

  if (!args.dryRun && changedFiles.length > 0) {
    stdout.write(
      `\nNext steps:\n` +
      `  1. Review the diff:  git diff\n` +
      `  2. Update LICENSE copyright holder and README badge URLs if needed.\n` +
      `  3. Reinstall + regenerate:  pnpm install && pnpm generate\n` +
      `  4. Verify:  pnpm lint && pnpm typecheck && pnpm build\n`,
    );
  }
};

const stderr = (msg) => process.stderr.write(`${msg}\n`);

main().catch((err) => {
  stderr(err?.stack || String(err));
  process.exit(1);
});
