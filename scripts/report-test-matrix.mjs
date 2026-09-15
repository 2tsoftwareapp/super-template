#!/usr/bin/env node
/**
 * Renders `.verify-stack/test-matrix-report.html` from `test-matrix.json` (the source of
 * truth for every row) joined with `.verify-stack/results.json` (what the last
 * `scripts/verify-stack.mjs` run actually observed).
 *
 * Rows that were not part of the last run are shown as "not run" rather than omitted, so
 * the report always describes the whole matrix.
 *
 * The stylesheet is intentionally flat: one accent colour, neutral surfaces, no shadows,
 * no gradients, no external assets, no icons.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { repoRoot } from "./merge-env.mjs";

const MATRIX_PATH = join(repoRoot, "test-matrix.json");
const RESULTS_PATH = join(repoRoot, ".verify-stack/results.json");
const OUTPUT_PATH = join(repoRoot, ".verify-stack/test-matrix-report.html");

const LAYER_ORDER = ["infra", "api", "web", "admin", "app", "cross"];
const STATUS_LABELS = {
  pass: "PASS",
  fail: "FAIL",
  blocked: "BLOCKED",
  skipped: "SKIP",
  "not-run": "NOT RUN",
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatDuration = (milliseconds) => {
  if (typeof milliseconds !== "number" || Number.isNaN(milliseconds)) {
    return "not measured";
  }
  if (milliseconds < 1000) {
    return `${milliseconds} ms`;
  }
  if (milliseconds < 60_000) {
    return `${(milliseconds / 1000).toFixed(1)} s`;
  }
  const minutes = Math.floor(milliseconds / 60_000);
  const seconds = Math.round((milliseconds % 60_000) / 1000);
  return `${minutes} min ${seconds} s`;
};

const formatTimestamp = (value) => {
  if (!value) {
    return "unknown";
  }
  return `${value.replace("T", " ").slice(0, 19)} UTC`;
};

if (!existsSync(MATRIX_PATH)) {
  process.stderr.write(`missing ${MATRIX_PATH}\n`);
  process.exit(1);
}

if (!existsSync(RESULTS_PATH)) {
  process.stderr.write(
    `missing ${RESULTS_PATH}\nRun \`node scripts/verify-stack.mjs\` first, then generate the report.\n`,
  );
  process.exit(1);
}

const matrix = JSON.parse(readFileSync(MATRIX_PATH, "utf8"));
const results = JSON.parse(readFileSync(RESULTS_PATH, "utf8"));
const resultById = new Map((results.results ?? []).map((entry) => [entry.id, entry]));

const rows = matrix.rows.map((row) => {
  const result = resultById.get(row.id);
  return {
    ...row,
    status: result?.status ?? "not-run",
    durationMs: result?.durationMs,
    actual: result?.actual ?? "not part of the last run",
    evidencePath: result?.evidencePath ?? null,
    logExcerpt: result?.logExcerpt ?? null,
  };
});

const byLayer = new Map(LAYER_ORDER.map((layer) => [layer, []]));
for (const row of rows) {
  if (!byLayer.has(row.layer)) {
    byLayer.set(row.layer, []);
  }
  byLayer.get(row.layer).push(row);
}

const countBy = (entries, status) => entries.filter((entry) => entry.status === status).length;
const failures = rows.filter((row) => row.status === "fail" || row.status === "blocked");
const skipped = rows.filter((row) => row.status === "skipped");
const notRun = rows.filter((row) => row.status === "not-run");

const totals = {
  total: rows.length,
  pass: countBy(rows, "pass"),
  fail: countBy(rows, "fail"),
  blocked: countBy(rows, "blocked"),
  skipped: countBy(rows, "skipped"),
  notRun: notRun.length,
};

const executed = totals.total - totals.notRun;
const verdict =
  failures.length > 0
    ? `${failures.length} row${failures.length === 1 ? "" : "s"} need attention`
    : totals.notRun === totals.total
      ? "No run recorded for this matrix yet"
      : "Every executed row passed";

const severityTotals = ["P0", "P1", "P2"].map((severity) => {
  const entries = rows.filter((row) => row.severity === severity);
  return {
    severity,
    total: entries.length,
    failing: countBy(entries, "fail") + countBy(entries, "blocked"),
  };
});

const summaryTable = LAYER_ORDER.filter((layer) => (byLayer.get(layer) ?? []).length > 0)
  .map((layer) => {
    const entries = byLayer.get(layer);
    const pass = countBy(entries, "pass");
    const fail = countBy(entries, "fail") + countBy(entries, "blocked");
    const skip = countBy(entries, "skipped");
    const missing = countBy(entries, "not-run");
    const ran = entries.length - missing;
    const rate = ran > 0 ? `${Math.round((pass / ran) * 100)}%` : "n/a";
    return `<tr>
        <th scope="row">${escapeHtml(layer)}</th>
        <td class="num">${entries.length}</td>
        <td class="num">${pass}</td>
        <td class="num${fail > 0 ? " accent" : ""}">${fail}</td>
        <td class="num">${skip}</td>
        <td class="num">${missing}</td>
        <td class="num">${rate}</td>
      </tr>`;
  })
  .join("\n");

const failureBlocks =
  failures.length === 0
    ? `<p class="muted">No failing or blocked rows in the last run.</p>`
    : failures
        .map(
          (row) => `<article class="failure">
        <header>
          <p class="failure-id">${escapeHtml(row.id)}</p>
          <p class="failure-name">${escapeHtml(row.name)}</p>
          <p class="meta">${escapeHtml(row.layer)} layer &middot; ${escapeHtml(row.severity)} &middot; ${escapeHtml(
            STATUS_LABELS[row.status] ?? row.status,
          )} &middot; ${escapeHtml(formatDuration(row.durationMs))}</p>
        </header>
        <p class="label">Observed</p>
        <p class="observed">${escapeHtml(row.actual)}</p>
        <p class="label">Expected</p>
        <p class="observed muted">${escapeHtml(row.expect)}</p>
        ${
          row.logExcerpt
            ? `<p class="label">Log excerpt</p>
        <pre>${escapeHtml(row.logExcerpt)}</pre>`
            : ""
        }
        <p class="label">Evidence</p>
        <p class="evidence">${escapeHtml(row.evidencePath ?? row.evidence)}</p>
      </article>`,
        )
        .join("\n");

const matrixTable = [...byLayer.entries()]
  .filter(([, entries]) => entries.length > 0)
  .map(([layer, entries]) => {
    const body = entries
      .map(
        (row) => `<tr class="status-${escapeHtml(row.status)}">
        <td class="id">${escapeHtml(row.id)}</td>
        <td class="layer">${escapeHtml(row.layer)}</td>
        <td class="name">${escapeHtml(row.name)}</td>
        <td class="sev">${escapeHtml(row.severity)}</td>
        <td class="status">${escapeHtml(STATUS_LABELS[row.status] ?? row.status)}</td>
        <td class="num">${escapeHtml(formatDuration(row.durationMs))}</td>
        <td class="evidence">${escapeHtml(row.evidencePath ?? row.evidence)}</td>
        <td class="actual">${escapeHtml(row.actual)}</td>
      </tr>`,
      )
      .join("\n");
    return `<h3>${escapeHtml(layer)}</h3>
      <table class="matrix">
        <thead>
          <tr>
            <th scope="col">Id</th>
            <th scope="col">Layer</th>
            <th scope="col">Name</th>
            <th scope="col">Severity</th>
            <th scope="col">Status</th>
            <th scope="col">Time</th>
            <th scope="col">Evidence</th>
            <th scope="col">Observed</th>
          </tr>
        </thead>
        <tbody>
${body}
        </tbody>
      </table>`;
  })
  .join("\n");

const skippedList =
  skipped.length === 0
    ? `<p class="muted">No skipped rows in the last run.</p>`
    : `<ul class="plain">
${skipped
  .map(
    (row) =>
      `<li><span class="id">${escapeHtml(row.id)}</span> <span class="muted">(${escapeHtml(row.layer)})</span> ${escapeHtml(row.actual)}</li>`,
  )
  .join("\n")}
      </ul>`;

const notRunList =
  notRun.length === 0
    ? `<p class="muted">Every row in the matrix took part in the last run.</p>`
    : `<ul class="plain">
${notRun
  .map(
    (row) =>
      `<li><span class="id">${escapeHtml(row.id)}</span> <span class="muted">(${escapeHtml(row.layer)})</span> not selected in the last run</li>`,
  )
  .join("\n")}
      </ul>`;

const environmentRows = [
  ["Matrix", "test-matrix.json"],
  ["Results", ".verify-stack/results.json"],
  ["Started", formatTimestamp(results.startedAt)],
  ["Finished", formatTimestamp(results.finishedAt)],
  ["Duration", formatDuration(results.durationMs)],
  ["API port", results.environment?.apiPort ?? "unknown"],
  ["Web port", results.environment?.webPort ?? "unknown"],
  ["Admin port", results.environment?.adminPort ?? "unknown"],
  ["Layers", (results.environment?.selectedLayers ?? []).join(", ") || "unknown"],
  [
    "Build",
    results.environment?.skipBuild
      ? "reused existing output (--skip-build)"
      : "rebuilt api, worker, web, admin",
  ],
  [
    "Apps after run",
    results.environment?.keepRunning ? "left running (--keep-running)" : "stopped by the harness",
  ],
]
  .map(
    ([label, value]) =>
      `<tr><th scope="row">${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`,
  )
  .join("\n");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Test matrix report</title>
<style>
  :root {
    --surface: #fbfbf9;
    --panel: #ffffff;
    --ink: #1b1b19;
    --ink-soft: #56564f;
    --rule: #e5e5e0;
    --accent: #9c3b1f;
  }

  * { box-sizing: border-box; }

  html { background: var(--surface); }

  body {
    margin: 0 auto;
    padding: 88px 40px 120px;
    max-width: 1180px;
    background: var(--surface);
    color: var(--ink);
    font-family: "Inter", "Helvetica Neue", Arial, sans-serif;
    font-size: 15px;
    font-weight: 300;
    line-height: 1.75;
    -webkit-font-smoothing: antialiased;
  }

  h1 {
    margin: 0;
    font-size: 32px;
    font-weight: 300;
    letter-spacing: -0.01em;
  }

  h2 {
    margin: 96px 0 8px;
    padding-bottom: 14px;
    border-bottom: 1px solid var(--rule);
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--ink-soft);
  }

  h3 {
    margin: 56px 0 4px;
    font-size: 17px;
    font-weight: 400;
    letter-spacing: 0.01em;
  }

  p { margin: 0 0 14px; }

  .lede { max-width: 62ch; color: var(--ink-soft); }

  .verdict {
    margin-top: 40px;
    font-size: 22px;
    font-weight: 300;
  }

  .verdict.accent { color: var(--accent); }

  .muted { color: var(--ink-soft); }

  .meta, .label, .evidence, .id, .num, pre {
    font-family: "SFMono-Regular", "JetBrains Mono", Menlo, Consolas, monospace;
  }

  .meta {
    font-size: 12px;
    letter-spacing: 0.02em;
    color: var(--ink-soft);
  }

  .label {
    margin: 26px 0 6px;
    font-size: 11px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--ink-soft);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 18px;
    background: var(--panel);
  }

  caption { text-align: left; }

  th, td {
    padding: 13px 16px 13px 0;
    border-bottom: 1px solid var(--rule);
    text-align: left;
    vertical-align: top;
  }

  thead th {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ink-soft);
  }

  tbody th { font-weight: 400; }

  .num { text-align: right; padding-right: 24px; font-variant-numeric: tabular-nums; }

  .accent { color: var(--accent); }

  table.facts td, table.facts th { width: auto; }
  table.facts th { width: 190px; color: var(--ink-soft); font-weight: 400; }

  table.matrix td { font-size: 13px; }
  table.matrix td.name { font-family: inherit; font-weight: 300; }
  table.matrix td.id, table.matrix td.layer, table.matrix td.sev, table.matrix td.status { white-space: nowrap; }
  table.matrix td.actual { color: var(--ink-soft); font-family: inherit; font-size: 12.5px; }
  table.matrix .id { font-size: 12.5px; }
  table.matrix td.evidence { font-size: 12px; color: var(--ink-soft); word-break: break-all; }
  table.matrix tr.status-fail td.status,
  table.matrix tr.status-blocked td.status { color: var(--accent); font-weight: 500; }
  table.matrix tr.status-not-run td { color: var(--ink-soft); }

  .failure {
    margin-top: 40px;
    padding: 26px 30px 30px;
    background: var(--panel);
    border-left: 2px solid var(--accent);
  }

  .failure-id { margin: 0; font-family: "SFMono-Regular", Menlo, monospace; font-size: 13px; }
  .failure-name { margin: 4px 0 8px; font-size: 17px; font-weight: 400; }
  .observed { color: var(--accent); }

  pre {
    margin: 0;
    padding: 18px 20px;
    background: var(--surface);
    border: 1px solid var(--rule);
    font-size: 12px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
    color: var(--ink-soft);
  }

  ul.plain { margin: 18px 0 0; padding-left: 0; list-style: none; }
  ul.plain li { padding: 11px 0; border-bottom: 1px solid var(--rule); }

  footer {
    margin-top: 110px;
    padding-top: 26px;
    border-top: 1px solid var(--rule);
    font-size: 13px;
    color: var(--ink-soft);
  }

  code { font-family: "SFMono-Regular", Menlo, monospace; font-size: 12.5px; }
</style>
</head>
<body>
  <h1>Test matrix report</h1>
  <p class="lede">Every row of <code>test-matrix.json</code>, joined with what the last
  <code>scripts/verify-stack.mjs</code> run observed. Evidence paths point at the raw
  per-row logs under <code>.verify-stack/logs/</code>.</p>

  <p class="verdict${failures.length > 0 ? " accent" : ""}">${escapeHtml(verdict)}</p>
  <p class="meta">${totals.total} rows &middot; ${executed} executed &middot; ${totals.pass} pass &middot;
  ${totals.fail + totals.blocked} fail/blocked &middot; ${totals.skipped} skipped &middot; ${totals.notRun} not run</p>

  <h2>Run</h2>
  <table class="facts">
    <tbody>
${environmentRows}
    </tbody>
  </table>

  <h2>By layer</h2>
  <table>
    <thead>
      <tr>
        <th scope="col">Layer</th>
        <th scope="col" class="num">Rows</th>
        <th scope="col" class="num">Pass</th>
        <th scope="col" class="num">Fail</th>
        <th scope="col" class="num">Skip</th>
        <th scope="col" class="num">Not run</th>
        <th scope="col" class="num">Pass rate</th>
      </tr>
    </thead>
    <tbody>
${summaryTable}
    </tbody>
  </table>
  <p class="meta">Pass rate counts executed rows only (skipped and not-run rows are excluded).
  Severity mix: ${severityTotals
    .map((entry) => `${entry.severity} ${entry.total} rows/${entry.failing} failing`)
    .join(" &middot; ")}.</p>

  <h2>Attention</h2>
${failureBlocks}

  <h2>Skipped</h2>
${skippedList}

  <h2>Not run in the last run</h2>
${notRunList}

  <h2>Full matrix</h2>
${matrixTable}

  <footer>
    <p>Reproduce: <code>node scripts/verify-stack.mjs</code> then
    <code>node scripts/report-test-matrix.mjs</code>. Add <code>--layers=</code>,
    <code>--only=</code> or <code>--skip-build</code> to narrow a run.</p>
    <p>Documented deviations live in <code>docs/testing/test-matrix.md</code>: the platform
    answers 400 (not 422) for payload validation, a file download token never replaces the
    session, and the admin console renders its pages client-side.</p>
  </footer>
</body>
</html>
`;

writeFileSync(OUTPUT_PATH, html, "utf8");

const sizeKb = (Buffer.byteLength(html, "utf8") / 1024).toFixed(1);
process.stdout.write(
  `report: ${OUTPUT_PATH} (${sizeKb} kB)\n` +
    `  rows ${totals.total}, pass ${totals.pass}, fail ${totals.fail}, blocked ${totals.blocked}, ` +
    `skipped ${totals.skipped}, not run ${totals.notRun}\n`,
);
