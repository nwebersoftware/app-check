# app-check

**One command to check a mobile build before the stores do.** `app-check` auto-detects the artifact,
runs the right audit, and aggregates the result:

```bash
npx @njweber/app-check ./build/app-release.aab ./build/YourApp.ipa ./assets/icon.png
```

| Artifact | What it's checked for | Under the hood |
|---|---|---|
| `*.aab`, `*.apk` | Android 16 KB page-size compliance | [`store-check`](https://github.com/nwebersoftware/store-check) |
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

Each check is also its own focused tool: `store-check` · `ipa-check` · `privacy-check` · `icon-check`.

An `.ipa` deliberately runs **two** audits — submission shape (`ipa-check`) and privacy declarations
(`privacy-check`).

## License

MIT.
