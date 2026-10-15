# app-check

[![npm](https://img.shields.io/npm/v/%40njweber%2Fapp-check)](https://www.npmjs.com/package/@njweber/app-check) [![downloads](https://img.shields.io/npm/dm/%40njweber%2Fapp-check)](https://www.npmjs.com/package/@njweber/app-check) [![CI](https://github.com/nwebersoftware/app-check/actions/workflows/ci.yml/badge.svg)](https://github.com/nwebersoftware/app-check/actions/workflows/ci.yml)


**One command to check a mobile build before the stores do.** `app-check` auto-detects the artifact,
runs the right audit, and aggregates the result:

```bash
npx @njweber/app-check ./build/app-release.aab ./build/YourApp.ipa ./assets/icon.png
```

| Artifact | What it's checked for | Under the hood |
|---|---|---|
| `*.aab` | Android 16 KB page size **and** the manifest audit | [`store-check`](https://github.com/nwebersoftware/store-check) + [`manifest-check`](https://github.com/nwebersoftware/manifest-check) |
| `*.apk` | Android 16 KB page size | [`store-check`](https://github.com/nwebersoftware/store-check) |
| `AndroidManifest.xml` | Android manifest audit | [`manifest-check`](https://github.com/nwebersoftware/manifest-check) |
| `*.ipa` | App Store submission pitfalls **and** privacy usage descriptions | [`ipa-check`](https://github.com/nwebersoftware/ipa-check) + [`privacy-check`](https://github.com/nwebersoftware/privacy-check) |
| `*.png` | icon size / alpha rules | [`icon-check`](https://github.com/nwebersoftware/icon-check) |

```
✓ store-check — 16 KB page-size audit
…
✓ ipa-check — iOS submission audit
…
✗ icon-check — app icon audit
  ✗ ios-alpha  has an alpha channel — the App Store icon must have NO transparency

✗ app-check: 3 checks, 1 failed.
```

## Usage

```bash
# explicit files
npx @njweber/app-check ./app-release.aab ./YourApp.ipa

# scan a build directory (recursive; skips node_modules/.git/ios/android)
npx @njweber/app-check --dir ./dist

# options
npx @njweber/app-check ./assets/icon.png --android        # adaptive-icon foreground rules
npx @njweber/app-check ./YourApp.ipa --bundle-id com.acme.app
npx @njweber/app-check --dir ./dist --json                # machine-readable
```

**Exit codes:** `0` all good · `1` at least one blocking issue · `2` bad input.

## CI

```yaml
- uses: nwebersoftware/app-check@main
  with:
    path: dist
```

## What it is not

It's a fast, offline pre-flight — not a substitute for the store's own validation. It catches the
*mechanical* rejections (alignment, plist shape, icon alpha) that are cheap to check and expensive
to discover mid-review.

## Family

Each check is also its own focused tool: `store-check` · `manifest-check` · `ipa-check` · `privacy-check` · `icon-check`.

An `.ipa` deliberately runs **two** audits — submission shape (`ipa-check`) and privacy declarations
(`privacy-check`). An `.aab` runs **two** as well — the 16 KB page-size check (`store-check`) and the
manifest audit (`manifest-check`).

## Follow along

More of this at **https://booleanbuild.com** — the tools hub, plus write-ups on store
rejections, CI, build gates, and shipping TestFlight builds without EAS. New posts land
roughly twice a month. Subscribe: https://booleanbuild.com/#subscribe

## License

MIT.
