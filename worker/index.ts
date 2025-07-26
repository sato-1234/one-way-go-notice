import { Hono } from "hono";
import { cors } from "hono/cors";
import scrapeRoutes from "./src/routes/scrape";
// 相対パスでインポート（Wokerはtsconfig.jsonのルールが適用されない。そのため相対でないとビルド時エラーになる）
import {
  ALLOWED_API_PATHS,
  type AllowedApiPath,
} from "../src/lib/shared/api-paths";

// --- 環境変数の型定義 ---
interface Env {
  DB: import("@cloudflare/workers-types").D1Database;
  WORKER_SCRAPING_TARGET_URL: string;
  ENVIRONMENT: "production" | "development"; // 環境変数の型定義
  ALLOWED_ORIGIN: string; // 許可するオリジンの型定義
  WORKER_API_SECRET: string; // wrangler secret put で設定したシークレットの型定義を追加
}

const app = new Hono<{ Bindings: Env }>().basePath("/api");

// --- CORSミドルウェア適用 ---
// c.env を参照するために、ミドルウェアの適用を app.use のコールバック内で行う
app.use("*", (c, next) => {
  // c.env.ENVIRONMENT の値で、適用するCORSミドルウェア自体を決定する
  const corsMiddleware = cors({
    // 本番「wrangler.toml」またはローカル「.dev.vars」で定義したオリジンを使う
    origin: c.env.ALLOWED_ORIGIN,
    allowMethods: ["POST", "OPTIONS"], // API処理が増えたらメゾットを増やす。'GET',など
  });

  // 決定したミドルウェアを実行する
  return corsMiddleware(c, next);
});

// --- 認証ミドルウェア ---
app.use("*", async (c, next) => {
  // パターン1: Cron Triggerからのリクエストか確認
  // Cronから実行された場合、Cloudflareがこのヘッダーを自動で付与します
  // Cf- で始まるHTTPヘッダーは、Cloudflareのシステムが内部的に使用するために予約されている。これらは特別なヘッダーであり、外部からのリクエストに含まれるヘッダーとは区別される（偽装不可）
  const isCron = c.req.header("Cf-Cron") === "true";
  if (isCron) {
    //console.log("Request from Cron Trigger. Access granted.");
    await next(); // 認証OK、次の処理へ
    return;
  }

  // パターン2: APIキーによる認証
  const authHeader = c.req.header("Authorization");
  const apiKey = c.env.WORKER_API_SECRET;

  if (!apiKey) {
    console.error("FATAL: WORKER_API_SECRET is not set in worker environment!");
    return c.json({ error: "Server configuration error." }, 500);
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json(
      { error: "Forbidden. Authorization header is missing or invalid." },
      403
    );
  }

  const providedKey = authHeader.substring(7); // "Bearer " の部分を削除

  if (providedKey === apiKey) {
    console.log("Access GRANTED");
    await next(); // 認証OK、次の処理へ
  } else {
    // キーが一致しない場合はエラー
    console.error("Access DENIED. Keys do not match.");
    return c.json({ error: "Unauthorized. Invalid API key." }, 401);
  }
});

// --- ルート定義 ---
// 1. ルート定義オブジェクトの型を定義
//    キーは許可されたパス名、値はHonoアプリケーションのインスタンス
type RouteMap = Record<AllowedApiPath, Hono<any>>; // Hono<any>で一旦簡略化

// 2. ルートとHonoインスタンスをマッピングするオブジェクトを作成
//    定義した型を適用する
const routes: Partial<RouteMap> = {
  // Partial<T> を使って、全てのキーが必須ではないことを示す
  scrape: scrapeRoutes,
  // status: statusRoutes,の実装はまだなので、ここでは定義しない
  // health-check: statusRoutes, の実装はまだなので、ここでは定義しない
};

// 3. 許可されたパスのリストをループして、ルートを動的に登録
for (const path of ALLOWED_API_PATHS) {
  const routeInstance = routes[path];

  // 4. `routes`オブジェクトに実装が存在する場合のみ、ルーティングを登録する
  if (routeInstance) {
    // app.route("/scrape", scrapeRoutes);
    app.route(`/${path}`, routeInstance);
  } else {
    console.warn(
      `[Hono] Route implementation for "${path}" not found. Skipping.`
    );
  }
}

export default app;

/*
  type RouteMap = Record<AllowedApiPath, Hono<any>>:
  Record<K, T>は、「キーがK型で、値がT型であるオブジェクト」という型を定義します。
  ここでは、「キーが"scrape" | "status" | "health-check"のどれかで、値がHonoのインスタンスであるオブジェクト」という型 RouteMap を作っています。

  const routes: Partial<RouteMap> = { ... }:
  Partial<T>は、Tのすべてのプロパティをオプショナル（任意）にするユーティリティ型です。
  これにより、「routesオブジェクトはRouteMapの形をしているけど、scrape, status, health-checkの全てを実装していなくても良い」とTypeScriptに伝えることができます。
  これで、health-checkの実装がまだなくても（型定義しているが実装まだ）、エラーは発生しなくなります。

  const routeInstance = routes[path];:
  ループ内で、現在のpath（例: "status"）に対応するHonoインスタンスをroutesオブジェクトから取得します。もしroutesにstatusの実装がなければ、routeInstanceはundefinedになります。

  if (routeInstance):
  routeInstanceがundefinedでない、つまり実装が存在する場合にのみ、app.route()を実行します。
  これにより、「実装がないのにルーティングを登録しようとする」というエラーを防ぎ、安全にルートを登録できます。
*/
