import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BIN = fileURLToPath(new URL('../bin/app-check.mjs', import.meta.url));

function run(args) {
  return spawnSync(process.execPath, [BIN, ...args], { encoding: 'utf8' });
}

test('--dir on a missing directory exits 2 with a clean message', () => {
  const r = run(['--dir', './definitely-not-a-real-dir']);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /cannot scan .*definitely-not-a-real-dir/);
  assert.doesNotMatch(r.stderr, /at .*app-check\.mjs:\d+/); // no raw stack trace
  assert.doesNotMatch(r.stderr, /Node\.js v/);
});

test('--dir with no checkable files exits 2 and says so', () => {
  const empty = mkdtempSync(join(tmpdir(), 'app-check-'));
  const r = run(['--dir', empty]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /no checkable files found/);
});

test('unknown flag exits 2', () => {
  const r = run(['--nope']);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /unknown flag/);
});
