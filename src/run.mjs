import { checkArtifact, formatReport as fmtAndroid } from '@njweber/store-check/src/check.mjs';
import { checkManifest, formatReport as fmtManifest } from '@njweber/android-manifest-check/src/check.mjs';
import { checkIpa, formatReport as fmtIpa } from '@njweber/ipa-check/src/check.mjs';
import { checkPrivacy, formatReport as fmtPrivacy } from '@njweber/privacy-check/src/check.mjs';
import { checkIcon, formatReport as fmtIcon } from 'icon-check/src/check.mjs';

const TOOLS = {
  android: { name: 'store-check', run: (buf) => checkArtifact(buf), fmt: fmtAndroid },
  manifest: { name: 'manifest-check', run: (buf) => checkManifest(buf), fmt: fmtManifest },
  ios: { name: 'ipa-check', run: (buf, o) => checkIpa(buf, o), fmt: fmtIpa },
  privacy: { name: 'privacy-check', run: (buf) => checkPrivacy(buf), fmt: fmtPrivacy },
  icon: { name: 'icon-check', run: (buf, o) => checkIcon(buf, o), fmt: fmtIcon },
};

/** Map a file path to the primary check that applies. */
export function classify(file) {
  const lower = String(file).toLowerCase();
  if (lower.endsWith('androidmanifest.xml')) return 'manifest';
  if (lower.endsWith('.aab') || lower.endsWith('.apk')) return 'android';
  if (lower.endsWith('.ipa')) return 'ios';
  if (lower.endsWith('.png')) return 'icon';
  return null;
}

/** Every check that should run for an artifact (some artifacts get more than one audit). */
export function checksFor(kind, file = '') {
  const lower = String(file).toLowerCase();
  if (kind === 'ios') return ['ios', 'privacy'];
  if (kind === 'android') return lower.endsWith('.aab') ? ['android', 'manifest'] : ['android'];
  return [kind];
}

/**
 * Run one check, never throwing: a bad artifact becomes a failing result, not a crash.
 * Returns { kind, name, label, report, text, error }.
 */
export function runCheck(kind, buf, opts = {}) {
  const t = TOOLS[kind];
  if (!t) throw new Error(`unknown check kind: ${kind}`);
  const label = opts.label ?? '';
  try {
    const report = t.run(buf, opts);
    return { kind, name: t.name, label, report, text: t.fmt(report, label), error: null };
  } catch (e) {
    return {
      kind,
      name: t.name,
      label,
      report: { ok: false },
      text: `${t.name} — could not check ${label || 'input'}\n  ${e.message}`,
      error: e.message,
    };
  }
}

export const SUPPORTED = ['.aab', '.apk', '.ipa', '.png'];
