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

``
npm install @clerk/nextjs
npm install @clerk/localizations

```

2. /src/app/layout.tsxにブロバイダーコード記述

3. /src/app/(auth)/sign-in/[[..sign-in]]/page.tsx を作成してコード貼り付け

4. /src/middleware.tsを作成してコード貼り付け

5. .env.local作成して値を貼り付け

```

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=XXXX
CLERK_SECRET_KEY=XXXX

# https://clerk.com/docs/guides/custom-redirects

# ログインページ（ログインしていない場合のリダイレクト先。最初のログインは新規登録になる）

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in

# 新規登録またはログイン後にリダイレクトするパス（既存コンポーネントのみ有効）

NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/dashboard

# FORCE_REDIRECT で解決しない場合のリダイレクト先（既存コンポーネントのみ有効）

NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard

# サインアウト後は <ClerkProvider afterSignOutUrl={"/"}> で

NEXT_PUBLIC_LINE_ADD_URL=LINE の友達追加する URL

```

## 3.利用規約とプライバシーポリシーページ作成

LINE のメールアドレス取得権限 で必要になるため、念のため事前に作成。

LINE ログインを使用しているサービスを参考にするとよい。（例：https://demae-can.com/navigate/termsofuse）

## 4.LINE でビジネス ID 作成

https://www.lycbiz.com/jp/service/line-official-account/
　でアカウント開設。

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

7. コンソール設定 → 作成したブロバイダー選択 → 作成チャネル「Messaging API」選択 → チャネル基本設定

- プライバシーポリシー URL：https:XXX（任意だが本番の場合推奨）

- 利用規約：https:XXX（任意だが本番の場合推奨）

8. コンソール設定 → 作成したブロバイダー選択 → 作成チャネル「Messaging API」選択 → Messaging API 設定

- チャネルアクセストークン：発行

9. コンソール設定 → 作成したブロバイダー選択 → 作成チャネル「Messaging API」選択 → セキュリティ設定

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

11. コンソール設定 → 作成したブロバイダー選択 → 作成チャネル「LINE ログイン」選択 → 「チャネル基本設定」

- リンクされた LINE 公式アカウント：作成した LINE 公式アカウントを選択して更新

- メールアドレス取得権限：任意だが、今回は念のため申請しました（プライバシーポリシーのページのスクショが必要になります。「あなたのアプリが、取得したメールアドレスを、どんな目的で、どのように利用するのかを、ユーザーにきちんと説明しているか」の内容をスクショ）

12. Clerk 側の設定（https://dashboard.clerk.com/apps） → アプリケーション選択

Configure → SSO connections → LINE の設定アイコンをクリック

- Enable for sign-up and sign-in：ON

- Use custom credentials：ON

- Channel ID：LINE のチャネル ID

- Channel Secret：LINE のチャネルシークレット

- Callback URL：表示された値は、後で使用するのでコピーする

- Scopes：空で OK（デフォルトで profile,openid,email が設定される）

- Always show account selector prompt：ON（ON で毎回「どの LINE アカウントでログインしますか？」を表示する意味）

13. コンソール設定 → チャネル選択 → 「LINE ログイン設定」

- コールバック URL：Callback URL を貼り付け

- チャネル名（上部）あたりにある「開発」→「公開」に変更

## 5. LINE ログイン友達追加するを表示する

<span style="color: red; ">※省略しました。エラー制業が複雑またはカスタムできる部分が限られていたため、今回は友達追加するボタンを別で用意しました。</span>

実装する場合は、既存コンポーネントではパラメータが足りないので、パラメータ追加したカスタムコンポーネントボタンを作成する必要があります。

詳細：https://developers.line.biz/ja/docs/line-login/link-a-bot/

```

// Clerk 側の作成する URL 詳細（カスタムコンポーネント作成する URL）
https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id={CHANNEL_ID}&redirect_uri={CALLBACK_URL}&state={STATE}&bot_prompt={BOT_PROMPT}&scope={SCOPE_LIST}

{CHANNEL_ID}：LINE ログインのチャネル ID

{CALLBACK_URL}：Clerk のカスタム資格情報で表示された CALLBACK_URL（LINE Developers コンソールの「コールバック URL」欄に登録した値）。これは LINE での認証が成功した後に、LINE がユーザーの情報を Clerk のサーバーに送り返すための「戻り先住所」

{STATE}：CSRF 攻撃を防ぐためのランダムな予測不可能な文字列。Clerk が、認証を開始するたびに、毎回新しいランダムな値を自動で生成します。

{BOT_PROMPT}：aggressive または normal を指定。LINE 友達追加する表示するためのパラメータ

{SCOPE_LIST}：Clerk のカスタム資格情報で登録した「スコープ」値（デフォルトは profile openid email）。Clerk が自動的に URL エンコードしてセット

````

## 6. ログイン後の指定条件入力ページ作成（/dashboard）：実装中

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
````

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
