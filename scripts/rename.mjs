#!/usr/bin/env node
/**
 * Rebrands this template for a new project.
 *
 * Replaces every casing of the template name and the original author/repo across
 * all git-tracked text files (lockfiles and binaries excluded). When the project
 * is not a git repository yet — the state `scripts/create-project.mjs` leaves it
 * in — it falls back to scanning the filesystem instead of failing:
 *
 *   super-template   (kebab)   -> <kebab>          package names, URLs, docker
 *   super_template   (snake)   -> <snake>          Dart package, generated client
 *   SuperTemplate    (Pascal)  -> <Pascal>         Dart class, OTP issuer
 *   Super Template   (Title)   -> <Title>          UI display strings
 *   truongnat        (author)  -> <author>         repo owner in URLs / badge
 *   com.example.mobile_app     -> <app id>         Android namespace + applicationId
 *   com.example.mobileApp      -> <app id>         iOS PRODUCT_BUNDLE_IDENTIFIER
 *
 * The mobile application identifier is derived, not prompted: `com.<name>.app`
 * where <name> is the project name folded to lowercase alphanumerics (see
 * `toAppIdentifier`). Both platforms get the same value.
 *
 * The generated Dart client under apps/mobile/lib/generated/ is rewritten too so
 * the tree is consistent immediately; `pnpm generate` reproduces it deterministically.
 *
 * Usage:
 *   node scripts/rename.mjs "Acme App" --author acme-co
 *   node scripts/rename.mjs "Acme App" --author acme-co --dry-run
 *   node scripts/rename.mjs            # interactive prompts
 */
import { readFileSync, writeFileSync, existsSync, statSync, readdirSync } from 'node:fs';
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
  // Android `namespace` + `applicationId`, and the mirrored Firebase templates.
  androidAppId: 'com.example.mobile_app',
  // iOS `PRODUCT_BUNDLE_IDENTIFIER` (plus the `.RunnerTests` variants, which
  // start with this prefix) — Flutter's default reverse-DNS form.
  iosBundleId: 'com.example.mobileApp',
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

// Directories that only ever hold generated output, so they are never rebranded.
const EXCLUDED_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.next',
  '.turbo',
  '.dart_tool',
  '.venv',
  '.gradle',
  '.idea',
]);

/** Every file in the tree, minus generated directories. */
const walkSourceFiles = (root, dir = root, out = []) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = resolve(dir, entry.name);

    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.has(entry.name)) walkSourceFiles(root, abs, out);
      continue;
    }

    out.push(relative(root, abs));
  }

  return out;
};

/**
 * Files eligible for rebranding.
 *
 * Git's index is preferred so generated-but-untracked files stay untouched. It
 * falls back to a filesystem walk when the project is not a git repository yet —
 * which is exactly the state `scripts/create-project.mjs` leaves behind, and the
 * documented next step is to run this script.
 */
const listRenameTargets = (root) => {
  try {
    const tracked = execSync('git ls-files', {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (tracked.length > 0) return { files: tracked, fromGit: true };
  } catch {
    // Not a git repository, or git unavailable — fall through to the walk.
  }

  return { files: walkSourceFiles(root), fromGit: false };
};

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
  <Project Name>   Free-form name; all casings are derived from it, including the
                   mobile application id ("Acme App" -> com.acmeapp.app).

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

/** Strip diacritics so a non-ASCII name still folds to ASCII (Ứng -> Ung, đ -> d). */
const foldDiacritics = (value) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');

/**
 * Application identifier for both mobile platforms: `com.<name>.app`.
 *
 * <name> is the project name folded to lowercase `[a-z0-9]` with all separators
 * dropped ("Acme App" -> `com.acmeapp.app`, "Ứng Dụng" -> `com.ungdung.app`).
 * Dropping rather than keeping hyphens/underscores is required by both stores: a
 * Java package segment must match `[a-zA-Z_$][a-zA-Z0-9_$]*`, so `com.acme-app.app`
 * is not even a valid Android namespace — and a leading digit is illegal there
 * too, hence the `app` prefix when the folded name would start with one. Apple
 * bundle ids accept alphanumerics, hyphens and periods, so the same value is
 * valid on iOS.
 */
const toAppIdentifier = (name) => {
  const folded = foldDiacritics(words(name).join('')).replace(/[^a-z0-9]/g, '');
  const segment = /^[0-9]/.test(folded) ? `app${folded}` : folded || 'app';
  return `com.${segment}.app`;
};

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
    appId: toAppIdentifier(projectName),
  };

  if (!NEW.kebab) {
    stderr(`Could not derive a valid identifier from "${projectName}".`);
    process.exit(1);
  }

  // Build replacement rules in apply order (URL-bearing casings before author).
  const rules = [
    [OLD.androidAppId, NEW.appId],
    [OLD.iosBundleId, NEW.appId],
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
  stdout.write(`  app id: ${OLD.androidAppId}  ->  ${NEW.appId}\n`);
  stdout.write(`          ${OLD.iosBundleId}   ->  ${NEW.appId}\n`);
  stdout.write(args.dryRun ? `\n[dry-run] no files will be written\n\n` : `\n`);

  const { files: tracked, fromGit } = listRenameTargets(repoRoot);

  if (!fromGit) {
    stdout.write(
      `\nNote: no git repository here, so the whole tree is being scanned.\n` +
        `      Generated directories (node_modules, dist, build, ...) are skipped.\n` +
        `      Run \`git init && git add -A\` first if you only want tracked files rewritten.\n\n`,
    );
  }

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
      `  4. Verify:  pnpm lint && pnpm typecheck && pnpm build\n` +
      `  5. Optional: move apps/mobile/android/app/src/main/kotlin/${OLD.androidAppId.replace(/\./g, '/')}/\n` +
      `     to match ${NEW.appId}. The build works either way (Kotlin does not require\n` +
      `     directory == package); only the folder name is left behind.\n` +
      `  6. Mobile release signing is project-owner work:\n` +
      `     apps/mobile/README.md -> "Release signing".\n`,
    );
  }
};

const stderr = (msg) => process.stderr.write(`${msg}\n`);

main().catch((err) => {
  stderr(err?.stack || String(err));
  process.exit(1);
});
