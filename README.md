# php2shell-checker Chrome Extension (unofficial)

![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)
![Manifest V3](https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4)

An **unofficial** Chrome extension that ports the URL-checking logic of
[openai/php2shell-checker](https://github.com/openai/php2shell-checker) into a
live badge: as you browse, it watches the current tab's `Server` /
`X-Powered-By` response headers, extracts the PHP version, and flags it
`OK` / `VULNERABLE` / `UNKNOWN` against the same cutoff table.

> **Disclaimer** — This project is **not created, maintained, or endorsed by
> OpenAI**. It is an independent, community port of the publicly available
> version-check logic in `openai/php2shell-checker` (Apache-2.0), rebuilt as a
> browser extension. "php2shell" and any related naming belong to the
> upstream project; this repo only reimplements its published, open-source
> detection logic.

## What it does

- Watches the active tab's `Server` / `X-Powered-By` response headers via
  `chrome.webRequest.onHeadersReceived`.
- Extracts a PHP version with the same regex as upstream, and compares it
  against the same `VULNERABLE_THROUGH` cutoff table (ported verbatim into
  [`logic.js`](logic.js), as of 2026-10-20).
- Shows a toolbar badge:
  - 🟢 **OK** — stable patch newer than the cutoff for its branch
  - 🔴 **!** — **VULNERABLE** — at or below the cutoff
  - ⚪ **?** — **UNKNOWN** — no header, an unlisted branch, or a prerelease build
- Clicking the icon opens a popup with the detected version, the reason, and
  the page URL.

## What it does *not* do (vs. the original CLI)

- **No server-side check.** `openai/php2shell-checker` also has a
  `--local` / `phpcheck-server` mode that runs `php -v` on a machine you have
  shell access to. A browser extension has no such access — this project only
  covers the URL-based `phpcheck-url` case.
- Same inherent limitation as upstream: hidden or absent headers read as
  `UNKNOWN`, which is **not** proof the site is patched.

## Install (load unpacked)

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select this folder
4. Visit any `http://` or `https://` site — the toolbar badge updates after
   the page loads

## How it's built

- `logic.js` — pure, dependency-free port of `patchStatus` / header-matching
  (no Chrome APIs, so it's unit-testable under plain Node)
- `background.js` — MV3 service worker; listens for response headers per tab,
  keeps an in-memory `Map` of the latest result per `tabId`, and clears it the
  instant a new top-level navigation starts (`webNavigation.onBeforeNavigate`)
  so a badge never shows a stale verdict from the previous page
- `popup.html` / `popup.js` — reads the active tab's result from the
  background worker; holds no detection logic of its own
- `icons/` — placeholder icons generated locally (feel free to replace)

If upstream updates its cutoff table, `logic.js` has to be updated by hand —
there's no automatic sync.

## Tests

```sh
node --test test/logic.test.mjs
```

11 unit tests cover the cutoff table boundaries, prerelease handling, and the
"a later vulnerable match is never hidden by an earlier OK-looking one" rule
— mirroring the precedence logic in the original `phpcheck.js`.

For manual, end-to-end testing in a real browser, `test/serve.py` serves a
local page with a chosen `X-Powered-By` (or `Server`) header so you can watch
the badge react without a real PHP install:

```sh
python3 test/serve.py --version 8.1.10           # VULNERABLE (cutoff is 34)
python3 test/serve.py --version 8.3.40 --header server
```

Then open `http://127.0.0.1:8765/` with the extension loaded.

## License

Apache License 2.0 (same as upstream) — see [LICENSE](LICENSE).

---

## 日本語について

本リポジトリは [openai/php2shell-checker](https://github.com/openai/php2shell-checker)
の「URLベースのPHPバージョン脆弱性チェック」ロジックを、ブラウジング中に自動判定・バッジ表示するChrome拡張機能として移植した**非公式**プロジェクトです。OpenAI公式のプロジェクトではなく、OpenAIによる承認・関与もありません。

- できること: アクティブタブのレスポンスヘッダ監視、OK/VULNERABLE/UNKNOWN判定、ポップアップでの詳細表示
- できないこと: サーバー側(`php -v`)のチェックは拡張機能の権限モデル上不可能なため非対応
- 導入: `chrome://extensions` → デベロッパーモード → 「パッケージ化されていない拡張機能を読み込む」でこのフォルダを選択
- テスト: `node --test test/logic.test.mjs`（11件）、`test/serve.py` でローカル検証用サーバーを起動可能
- ライセンス: Apache License 2.0
