# タスク指示書: Pages Functions への移行

現在のスタンドアロン Worker 構成を、Next.js と統合された Pages Functions アーキテクチャにリファクタリングします。

以下の手順とファイル構成案に基づいて、必要なコードの変更点を提示してください。

## 変更後のファイル構成案

- `worker/` -> `functions/` にリネーム
- `worker/index.ts` -> `functions/api/_middleware.ts` に移動・リネーム
- `worker/src/routes/scrape.ts` -> `functions/api/scrape.ts` に移動

## `_middleware.ts` の要件

- Hono インスタンスを作成し、共通ミドルウェア（CORS, API キー認証）を適用する。
- `app.route()` を使って、`/scrape` パスへのリクエストを `scrape.ts` に委譲する。
- 最終的に `onRequest` として Hono インスタンスをエクスポートする。

## `scrape.ts` の要件

- `basePath` を持たない、独立した Hono インスタンスとして定義する。
- `/` パスへの POST リクエストを処理する。

上記の要件を満たす、具体的なコードを生成してください。
ユーザー自身でコードの作成・更新・削除したときもあるので、ユーザーに確認にしながら生成をおこないます。
