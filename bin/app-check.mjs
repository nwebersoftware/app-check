#!/usr/bin/env node
import { readFileSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';

import { classify, checksFor, runCheck, SUPPORTED } from '../src/run.mjs';

const HELP = `app-check — check a mobile build before the stores do

Usage:
  app-check <path...> [options]

Checks (auto-detected by extension):
  *.aab, *.apk   Android — 16 KB page size     (store-check)
  *.ipa          iOS — submission pitfalls      (ipa-check)
  *.png          icon rules                     (icon-check)

Options:
  --dir <dir>        also scan a directory for the above (recursive)
  --android          treat PNGs as Android adaptive-icon foregrounds
  --bundle-id <id>   expected iOS CFBundleIdentifier
  --json             machine-readable output
  -h, --help

Exit: 0 all good · 1 blocking issue(s) · 2 bad input.
`;

function parse(argv) {
  const paths = [];
  const opts = { json: false, android: false, dir: null, bundleId: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') opts.json = true;
    else if (a === '--android') opts.android = true;
    else if (a === '--dir') opts.dir = argv[++i];
    else if (a === '--bundle-id') opts.bundleId = argv[++i];
    else if (a === '-h' || a === '--help') { process.stdout.write(HELP); process.exit(0); }
    else if (a.startsWith('-')) { process.stderr.write(`unknown flag: ${a}\n`); process.exit(2); }
    else paths.push(a);
  }
  return { paths, opts };
}

const SKIP = new Set(['node_modules', '.git', 'ios', 'android', '.expo']);

function collect(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || SKIP.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) collect(p, out);
    else if (SUPPORTED.includes(extname(e.name).toLowerCase())) out.push(p);
  }
  return out;
}

const { paths, opts } = parse(process.argv.slice(2));
const files = [...paths];
if (opts.dir) files.push(...collect(opts.dir));

if (files.length === 0) {
  process.stderr.write(HELP);
  process.exit(2);
}

const results = [];
let badInput = false;

for (const file of files) {
  const kind = classify(file);
  if (!kind) {
    process.stderr.write(`skipped (unrecognized): ${file}\n`);
    badInput = true;
    continue;
  }
  let buf;
  try {
    buf = readFileSync(file);
  } catch (e) {
    process.stderr.write(`cannot read ${file}: ${e.message}\n`);
    badInput = true;
    continue;
  }
  for (const k of checksFor(kind)) {
    const co = { label: file };
    if (k === 'icon' && opts.android) co.platform = 'android';
    if (k === 'ios' && opts.bundleId) co.bundleId = opts.bundleId;
    results.push(runCheck(k, buf, co));
  }
}

const failed = results.filter((r) => !r.report.ok).length;

if (opts.json) {
  const payload = {
    ok: failed === 0 && results.length > 0,
    files: results.map((r) => ({
      file: r.label,
      tool: r.name,
      ok: !!r.report.ok,
      error: r.error,
      checks: r.report.checks ?? undefined,
      failures: r.report.failures?.map((f) => f.abi),
    })),
  };
  process.stdout.write(JSON.stringify(payload, null, 2) + '\n');
} else {
  for (const r of results) {
    process.stdout.write(r.text + '\n');
    process.stdout.write('\n' + '─'.repeat(60) + '\n\n');
  }
  const n = results.length;
  const summary = `app-check: ${n} check${n === 1 ? '' : 's'}, ${failed} failed.`;
  process.stdout.write(failed === 0 ? `✓ ${summary}\n` : `✗ ${summary}\n`);
}

if (results.length === 0) process.exit(2);
process.exit(failed > 0 ? 1 : 0);
