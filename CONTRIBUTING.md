# Contributing

This is a small, personal side project — an unofficial browser-extension port
of [openai/php2shell-checker](https://github.com/openai/php2shell-checker)'s
URL-check logic. Issues and PRs are welcome, with a couple of notes:

- **Keep `logic.js` in sync with upstream.** If OpenAI updates the
  `VULNERABLE_THROUGH` cutoff table or the detection regex in
  `phpcheck-url/scripts/phpcheck.js`, please link the upstream change in your
  PR so the port can be verified against it.
- **Run the tests before opening a PR**: `node --test test/logic.test.mjs`.
  Add a test case for any new cutoff-table entry or edge case you touch.
- This repo only covers the URL-based check (`phpcheck-url`). The
  server-side (`phpcheck-server`, `php -v`) case has no meaningful browser
  equivalent and is out of scope by design — please don't add native
  messaging or similar workarounds without discussing the security
  implications first (it would mean the extension can execute local
  commands).
- No CLA, no attribution requirements beyond the Apache-2.0 LICENSE.
