import { test } from 'node:test';
import assert from 'node:assert/strict';

import { classify, checksFor, runCheck, SUPPORTED } from '../src/run.mjs';
import { makePng } from './helpers.mjs';

test('classifies artifacts by extension', () => {
  assert.equal(classify('app-release.aab'), 'android');
  assert.equal(classify('app.apk'), 'android');
  assert.equal(classify('MyApp.IPA'), 'ios');
  assert.equal(classify('icon.png'), 'icon');
  assert.equal(classify('README.md'), null);
});

test('supported list covers the three kinds', () => {
  assert.deepEqual(SUPPORTED.sort(), ['.aab', '.apk', '.ipa', '.png']);
});

test('an .ipa maps to two audits (submission + privacy)', () => {
  assert.deepEqual(checksFor(classify('App.ipa')), ['ios', 'privacy']);
  assert.deepEqual(checksFor(classify('app.aab')), ['android']);
  assert.deepEqual(checksFor(classify('icon.png')), ['icon']);
});

test('runs the icon check and formats it', () => {
  const r = runCheck('icon', makePng(1024, 1024, 2), { label: 'icon.png' });
  assert.equal(r.name, 'icon-check');
  assert.equal(r.report.ok, true);
  assert.match(r.text, /icon-check/);
  assert.equal(r.error, null);
});

test('surfaces a blocking issue (alpha) through the runner', () => {
  const r = runCheck('icon', makePng(1024, 1024, 6), { label: 'icon.png' });
  assert.equal(r.report.ok, false);
  assert.equal(r.report.failed.length, 1);
});

test('android platform option flows through to the icon check', () => {
  const r = runCheck('icon', makePng(512, 512, 2), { platform: 'android' });
  assert.ok(r.report.warned.some((c) => c.id === 'android-alpha'));
});

test('a broken artifact fails instead of throwing', () => {
  const r = runCheck('android', Buffer.from('not a zip'));
  assert.equal(r.report.ok, false);
  assert.ok(r.error);
  assert.match(r.text, /could not check/);
});

test('unknown kind throws (programmer error)', () => {
  assert.throws(() => runCheck('wat', Buffer.alloc(1)));
});
