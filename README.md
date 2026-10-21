# php2shell-checker Chrome拡張（非公式ポート）

[openai/php2shell-checker](https://github.com/openai/php2shell-checker) のURLチェック判定ロジック（カットオフ表・バージョン抽出の正規表現）をそのまま移植し、ブラウジング中に自動でPHPバージョンの脆弱性有無をバッジ表示するChrome拡張機能です。openai/php2shell-checker 本体とは別の、個人用の非公式ポートです。

## できること

- 今見ているタブのレスポンスヘッダ（`Server` / `X-Powered-By`）を監視し、PHPバージョンを抽出
- `background.js` 内の `VULNERABLE_THROUGH` カットオフ表（phpcheck.js から忠実に移植、2026-10-20時点）と照合
- 拡張機能アイコンにバッジ表示：
  - 緑 `OK` — カットオフより新しい安定パッチ
  - 赤 `!` — `VULNERABLE`
  - グレー `?` — `UNKNOWN`（ヘッダが無い/読めない/未知のブランチ）
- ポップアップでバージョン・判定理由・対象URLを表示、ワンクリックでページをリロードして再チェック

## できないこと（原作との違い）

- **サーバー側CLI（`php -v`）のチェックはできません** — ブラウザ拡張機能の権限モデル上、サーバーのシェルには触れられないため、`phpcheck-server` 相当の機能はありません。URLベースの `phpcheck-url` 相当のみです。
- ヘッダが隠されている/リダイレクト先でしか出ない場合は原作と同様 `UNKNOWN` になります。`UNKNOWN` は「パッチ済み」を意味しません。

## インストール（開発者モードでの読み込み）

1. Chromeで `chrome://extensions` を開く
2. 右上の「デベロッパーモード」をON
3. 「パッケージ化されていない拡張機能を読み込む」をクリックし、このフォルダ（`php2shell-checker-extension/`）を選択
4. 任意のHTTP/HTTPSサイトを開くと、ツールバーのアイコンにバッジが表示されます

## 仕組み・設計メモ

- `background.js`（MV3 service worker）が `chrome.webRequest.onHeadersReceived` でメインフレームのレスポンスヘッダを監視し、タブごとに判定結果をメモリ上の `Map` に保持
- `chrome.webNavigation.onBeforeNavigate` でトップレベルの遷移開始を検知し、前のページの判定結果・バッジを即座にクリア（古い判定が次のページに持ち越されるのを防止）
- `popup.js` はアクティブタブの判定結果を `chrome.runtime.sendMessage` で取得して表示するだけで、判定ロジックは一切持たない（単一の真実源は `background.js`）
- カットオフ表・正規表現は原作 `skills/phpcheck-url/scripts/phpcheck.js` と1対1で対応させています。原作が表を更新したら、ここも手動で追随させる必要があります（自動取得は行っていません）

## テスト用ページ

`test/fake-php-server.html` ... ではなく、実際のHTTPレスポンスヘッダでしか動作しないため、ローカルで試す場合は `test/serve.py` で簡易HTTPサーバーを立て、`X-Powered-By` ヘッダを好きなPHPバージョンに差し替えて確認できます。`python3 test/serve.py --version 8.1.10` のように起動し、`http://127.0.0.1:8765/` を開いてください。

## ライセンス

原作 [openai/php2shell-checker](https://github.com/openai/php2shell-checker) は Apache License 2.0。このポートも同ライセンスに合わせています（`LICENSE` 参照）。
