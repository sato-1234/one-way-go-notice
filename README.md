# 片道 GO 通知アプリ（実装中）

現在、実装中になるため、コードは未完成になります。

## 1. 環境構築

Next.js

```
npx create-next-app@latest

√ What is your project named? ... one-way-go-notice（プロジェクト名）
√ Would you like to use TypeScript? ... Yes
√ Would you like to use ESLint? ... Yes
√ Would you like to use Tailwind CSS? ... No / Yes（任意）
√ Would you like your code inside a `src/` directory? ... Yes
√ Would you like to use App Router? (recommended) ... Yes
√ Would you like to use Turbopack for `next dev`? ... No
√ Would you like to customize the import alias (`@/*` by default)? ... No

npm run dev

```

## 2. Clerk で認証で使用する applications 作成（アカウント登録後）

1. ブロバイダーは LINE のみ選択し以下実行

```
npm install @clerk/nextjs
npm install @clerk/localizations
```

2. /src/middleware.ts を作成してコード貼り付け

3. /src/app/layout.tsx にブロバイダーコード記述

4. /src/app/(auth)/sign-in/[[..sign-in]]/page.tsx を作成してコード貼り付け

5. .env.local 作成して値を貼り付け

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=XXXX
CLERK_SECRET_KEY=XXXX

# https://clerk.com/docs/guides/custom-redirects
# ログインページ（ログインしていない場合のリダイレクト先。最初のログインは新規登録になる）
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in

# ログイン後にリダイレクトするパス（既存コンポーネントのみ有効）
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/dashboard

# FORCE_REDIRECTで解決しない場合のリダイレクト先（既存コンポーネントのみ有効）
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard

# サインアウト後は <ClerkProvider afterSignOutUrl={"/"}> で

NEXT_PUBLIC_LINE_ADD_URL=友達追加するボタンのURL
NEXT_PUBLIC_SCRAPING_TARGET_URL=https://cp.toyota.jp/rentacar/
NEXT_PUBLIC_CONTACT_URL=お問い合わせ先のURL（グーグルフォーム使用するため用意）
NEXT_PUBLIC_COURT_ADDRESS=利用規約で使用する裁判所の住所（都道府県）

# Cloudflare Worker URLs
# デプロイ予定先のcloudFlareでは.envは使用できない。
# デプロイ後はcloudFlareのGUIで設定すること
WORKER_URL=http://localhost:8787
WORKER_API_SECRET=openssl で生成したAPIキーを貼り付け(後の工程で作成します)
```

## 3.利用規約とプライバシーポリシーページ作成

LINE のメールアドレス取得権限 で必要になるため、念のため事前に作成。

LINE ログインを使用しているサービスを参考にするとよい。（例：https://demae-can.com/navigate/termsofuse）

## 4.LINE でビジネス ID 作成

https://www.lycbiz.com/jp/service/line-official-account/ でアカウント開設。

1. ホーム(https://manager.line.biz/) → アカウント選択 → プロフィール設定（任意）

2. ホーム → アカウント選択 → チャット：オフ（任意）

3. ホーム → アカウント選択 → トークルーム管理 → あいさつメッセージ　の設定

```

はじめまして！{AccountName}です。
友だち追加ありがとうございます(moon wink)

このアカウントでは、片道 GO 通知(https://XXXX)で入力した条件にそって、その条件に対して一度のみ通知いたします。（全条件の場合、新しい片道レンタカーが表示される度に通知いたします）

また、こちらチャットのやり取りは行っていませんので、質問や要望がある場合はこちら(https://XXXX)にご連絡ください。

```

4. ホーム → アカウント選択 → 設定 → アカウント認証をリクエスト（任意だが本番の場合推奨）

5. コンソール設定（https://developers.line.biz/console/） → ブロバイダー作成

6. ホーム → アカウント選択 → 設定 → Messaging API（作成したブロバイダー選択してチャネル作成）

7. コンソール設定 → 作成したブロバイダー選択 → 作成した「Messaging API」チャネル選択 → チャネル基本設定

- プライバシーポリシー URL：https:XXX（任意だが本番の場合推奨）

- 利用規約：https:XXX（任意だが本番の場合推奨）

8. コンソール設定 → 作成したブロバイダー選択 → 作成した「Messaging API」チャネル選択 → Messaging API 設定

- チャネルアクセストークン：発行

9. コンソール設定 → 作成したブロバイダー選択 → 作成した「Messaging API」チャネル選択 → セキュリティ設定

- IP アドレス追加：（任意だが本番の場合推奨）

10. コンソール設定 → 作成したブロバイダー選択 → 新規チャネル作成 → 「LINE ログイン」

- チャネルの種類：LINE ログイン

- プロバイダー：作成したブロバイダー名

- 会社・事業者の所在国・地域：日本

- チャネルアイコン：任意

- チャネル名：片道 GO 通知（非公式）

- チャネル説明：このアカウントでは、片道 GO 通知(https://XXXX)で入力した条件にそって、その条件に対して一度のみ通知いたします。（全条件の場合、新しい片道レンタカーが表示される度に通知いたします）

- アプリタイプ ：ウェブアプリ（ネイティブアプリも選択可能）

- 2 要素認証の必須化：ON

- メールアドレス：有効なメールアドレス

- プライバシーポリシー URL：https:XXX（任意だが本番の設定推奨）

- 利用規約：https:XXX（任意だが本番の設定推奨）

11. コンソール設定 → 作成したブロバイダー選択 → 作成した「LINE ログイン」チャネル選択 → 「チャネル基本設定」

- リンクされた LINE 公式アカウント：作成した LINE 公式アカウントを選択して更新

- メールアドレス取得権限：任意だが、今回は念のため申請しました（プライバシーポリシーのページ等で「あなたのアプリが、取得したメールアドレスを、どんな目的で、どのように利用するのかを、ユーザーにきちんと説明しているか」の内容をスクショして申請する必要があります）

12. Clerk 側の設定（https://dashboard.clerk.com/apps） → アプリケーション選択

Configure → SSO connections → LINE の設定アイコンをクリック

- Enable for sign-up and sign-in：ON

- Use custom credentials：ON

- Channel ID：LINE ログイン のチャネル ID

- Channel Secret：LINE ログイン のチャネルシークレット

- Callback URL：表示された値は、後で使用するのでコピーする

- Scopes：空で OK（デフォルトで profile,openid,email が設定される）

- Always show account selector prompt：ON（ON で毎回「どの LINE アカウントでログインしますか？」を表示する意味）

13. コンソール設定 → チャネル選択 → 「LINE ログイン設定」

- コールバック URL：Callback URL を貼り付け

- チャネル名（上部）あたりにある「開発」→「公開」に変更

## 5. 認証時に「友達を追加する」表示する

<span style="color: red; ">※省略しました。エラー制業が複雑またはカスタムできる部分が限られていたため、今回は友達追加するボタンを別で用意しました。</span>

もし実装する場合は、既存コンポーネントではパラメータが足りないので、パラメータ追加したカスタムコンポーネントボタンを作成する必要があります。

詳細：https://developers.line.biz/ja/docs/line-login/link-a-bot/

```

// Clerk 側の作成する URL 詳細（カスタムコンポーネント作成する URL）
https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id={CHANNEL_ID}&redirect_uri={CALLBACK_URL}&state={STATE}&bot_prompt={BOT_PROMPT}&scope={SCOPE_LIST}

{CHANNEL_ID}：LINE ログインのチャネル ID

{CALLBACK_URL}：Clerk のカスタム資格情報で表示された CALLBACK_URL（LINE Developers コンソールの「コールバック URL」欄に登録した値）。これは LINE での認証が成功した後に、LINE がユーザーの情報を Clerk のサーバーに送り返すための「戻り先住所」

{STATE}：CSRF 攻撃を防ぐためのランダムな予測不可能な文字列。Clerk が、認証を開始するたびに、毎回新しいランダムな値を自動で生成します。

{BOT_PROMPT}：aggressive または normal を指定。LINE 友達追加する表示するためのパラメータ

{SCOPE_LIST}：Clerk のカスタム資格情報で登録した「スコープ」値（デフォルトは profile openid email）。Clerk が自動的に URL エンコードしてセット

```

## 6. 定期実行に使用する API 処理作成：実装中

スクレイピングと API 処理で必要なライブラリインストール。

スクレイピングを API 処理にする理由は定期実行（Cron Job）のトリガーにするため。は Cloudflare Workers の API の型情報を TypeScript に教えるための「@cloudflare/workers-types」パッケージもインストール（cloudflare で運用を想定しているため）

```
npm i axios cheerio
npm i react-hook-form
npm i lucide-react
npm i uuid
npm i @types/uuid --save-dev
npm i @cloudflare/workers-types --save-dev
```

tsconfig.json 一部追加

```tsconfig.json
{
  "compilerOptions": {
    // 省略　・・・

    "types": ["@cloudflare/workers-types"],//追加
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

D1 データベース作成

```
npm i wrangler --save-dev
npx wrangler logout // 以前ログインしている場合使は念のためログアウト
npx wrangler login // ブラウザで[許可(Allow)]
npx wrangler d1 create データベース名
```

wrangler.toml を作成して、データベース の設定を記述

```
name = "Cloudflare Workerの名前"

main = "worker/index.ts" # エントリーポイント

compatibility_date = "XXXX-XX-XX" # ファイルを作成した日付

# データベース作成コマンド実行時に表示されたD1データベースの情報を貼り付けます
[[d1_databases]]
binding = "DB" # Workerからデータベースを呼び出すときの名前になります
database_name = "作成したデータベース名"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" # DBのID

[vars]
ALLOWED_ORIGIN = "http://localhost:3000" # Next.jsデプロイ前に変更すること
ENVIRONMENT = "production"
WORKER_SCRAPING_TARGET_URL = "https://cp.toyota.jp/rentacar/"
```

schema.sql を作成（コマンドで SQL を実行するため）

```
-- テーブルが存在すれば削除
DROP TABLE IF EXISTS scraped_data;
DROP TABLE IF EXISTS scraping_metadata;

-- scraping_metadata テーブル: スクレイピング処理の全体的な状態を管理
CREATE TABLE scraping_metadata (
  id INTEGER PRIMARY KEY CHECK (id = 1), -- 常に1行だけ存在するように制約
  status TEXT DEFAULT 'ok' NOT NULL, -- 現在の状態 ('ok', 'timeout_error', 'permanent_error', 'after_restoration')
  consecutive_timeout_count INTEGER DEFAULT 0 NOT NULL, -- 連続タイムアウト回数
  halted_until TEXT, -- 一時停止が解除される日時 (ISO 8601)
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP -- 最終更新日時
);

-- scraped_data テーブル: スクレイピングで取得したレンタカー情報を格納
CREATE TABLE scraped_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT, -- 主キー (自動採番)
  execution_id TEXT NOT NULL, -- 実行ID (どの実行で取得したか)
  is_latest INTEGER NOT NULL DEFAULT 0, -- 最新データの場合は 1、それ以外は 0
  departure_store TEXT NOT NULL, -- 出発店舗 (JSON 文字列)
  return_store TEXT NOT NULL, -- 返却店舗
  car_type TEXT NOT NULL, -- 車種 (JSON 文字列)
  car_condition TEXT NOT NULL, -- 車両条件
  departure_period TEXT NOT NULL, -- 出発期間 (JSON 文字列)
  reservation_phone TEXT NOT NULL, -- 予約電話 (JSON 文字列)
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP -- 作成日時 (ISO 8601)
);

-- 初期データの挿入
INSERT INTO scraping_metadata (id, status, consecutive_timeout_count) VALUES (1, 'ok', 0);
```

コマンドで SQL を実行

```
npx wrangler d1 execute one-way-go-notice-db --file=schema.sql
npx wrangler d1 execute one-way-go-notice-db --remote --file=schema.sql

# データベース名、テーブル数、IDを確認できる
wrangler d1 list

# データ確認
npx wrangler d1 execute one-way-go-notice-db --local --command "SELECT * FROM scraping_metadata;"
npx wrangler d1 execute one-way-go-notice-db --remote --command "SELECT * FROM scraping_metadata;"

# スクレイピングで恒久エラー（HTML構造が変化したのでコードの修正必須）になった場合
# コード修正後の手動復旧コマンド
npx wrangler d1 execute one-way-go-notice-db --local --command "UPDATE scraping_metadata SET status = 'after_restoration' WHERE id = 1;"
```

HONO 導入

```
npm install hono
npm install @types/hono --save-dev
```

スクレイピング実装完了後、以下を実行し、http://localhost:3000/api/scrape にアクセスしてテスト。

```
# http://localhost:3000/api/scrape 用
npm run dev

# http://localhost:8787/api/scrape HONOのAPI処理用(D1接続処理)
npx wrangler dev worker/index.ts --port 8787

# APIがgetではなくpostで実装している場合は、curlを使用。
curl -X POST http://localhost:3000/api/scrape

# http://localhost:3000/api/scrape でスクレイピングデータがD1に保存されたか確認
npx wrangler d1 execute one-way-go-notice-db --local --command "SELECT * FROM scraped_data;"
```

作成した Woker（API）処理を一旦デプロイして、確認してみます。

```
npx wrangler deploy
npm run build
npm run start
curl -X POST http://localhost:3000/api/scrape
npx wrangler d1 execute one-way-go-notice-db --remote --command "SELECT * FROM scraped_data;"
```

セキュリティ対策：API 実行（URL）のアクセスは定期実行とテスト時の手動実行にする。

```
openssl rand -base64 32 # 共有シークレット (APIキー) 作成（テスト時の手動用）
npx wrangler login
npx wrangler secret put WORKER_API_SECRET
?Enter a secret value: APIキー貼り付け
```

.env に API-KEY 追加

```
WORKER_API_SECRET=APIキー貼り付け
```

.dev.vars を新規作成してこちらにも API-KEY 追加（ローカルでの手動テスト用）

```
WORKER_API_SECRET = "APIキー貼り付け"
ENVIRONMENT = "development"
ALLOWED_ORIGIN = "http://localhost:3000"
```

CORS と API_KEY の追加処理実装後(Clerk の middleware.ts も API ルート許可の編集がいる)、ローカル API・リモート API & 再テスト。

① .env または.dev.vars の API-KEY を一致しないよう変更してテスト（エラーなら OK）
② .env または.dev.vars の API-KEY を一致させテスト（ステータス 200 なら OK）
③ post 番号を 3001 にしてテスト。post 番号を 3000 のみ許可しているため、エラーなら OK

```
# まずはローカルAPIの再テストから
npx wrangler d1 execute one-way-go-notice-db --local --command "DELETE FROM scraped_data;"
npm run dev
npx wrangler dev worker/index.ts --port 8787
curl -v -X POST http://localhost:3000/api/scrape
npx wrangler d1 execute one-way-go-notice-db --local --command "SELECT * FROM scraped_data;"

# CORS テスト：post番号を3001にしてブラウザのコンソールに入力してテスト
npm run dev -- --port 3001
npx wrangler dev worker/index.ts --port 8787
# curl -v -X POST http://localhost:3000/api/scrape だとブラウザ(CORS)ではなく(curl)処理になるため、http://localhost:3001 の画面を開いて、以下をコンソールに入力。ペーストできない場合「allow pasting」を直接入力しEnter後に、ペースト
fetch('http://localhost:8787/api/scrape', {
    method: 'POST',
    headers: {
        // 正しいAPIキーを手動で設定
        'Authorization': 'Bearer API_KEY'
    }
})
.then(res => res.json())
.then(data => console.log(data))
.catch(error => console.error(error));

# リモートAPIの再テスト
npx wrangler d1 execute one-way-go-notice-db --remote --command "DELETE FROM scraped_data;"
npx wrangler deploy
npm run build
npm run start
curl -v -X POST http://localhost:3000/api/scrape
npx wrangler d1 execute one-way-go-notice-db --remote --command "SELECT * FROM scraped_data;"

# CORS テスト：post番号を3001にしてブラウザのコンソールに入力してテスト
fetch('デプロイ先のWORKER_URL手動入力', {
    method: 'POST',
    headers: {
        // 正しいAPIキーを手動で設定
        'Authorization': 'Bearer API_KEY'
    }
})
.then(res => res.json())
.then(data => console.log(data))
.catch(error => console.error(error));
```

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
