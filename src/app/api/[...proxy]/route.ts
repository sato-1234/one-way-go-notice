import { NextResponse } from "next/server";
import { ALLOWED_API_PATHS, type AllowedApiPath } from "@/shared/api-paths"; // AllowedApiPath 型もインポート
// import { mockServiceItems } from "@/lib/mocks/service-items";

// Cloudflare WorkerのURL (ローカル開発用)
const WORKER_URL = process.env.WORKER_URL!;

// 環境変数からAPIキーを読み込む(手動実行用)
const WORKER_API_SECRET = process.env.WORKER_API_SECRET!;

/**
 * すべてのPOSTリクエストをWorkerに転送するハンドラ
 * @param request Next.jsが受け取ったリクエスト
 * @param params URLの動的な部分（例: { proxy: ['scrape'] }）
 */

// Next.jsのサーバーは、デフォルトではCORSヘッダー（Access-Control-Allow-Originなど）を返しません。
// そのため、https://別オリジン から https://自サイト へのAPIリクエストを「オリジンが違うから危険だ」と判断し、自動的にブロック。なのでWokerと違いCORS対策は不要
async function handler(
  request: Request,
  context: { params: Promise<{ proxy?: string[] }> } //{ params }の引数名ではエラーになると思う
) {
  // 開発環境の時だけモックデータを返すようにする
  // if (process.env.NODE_ENV === "development") {
  //   console.log("💡 [MOCK MODE] Returning mock service items...");
  //   await new Promise((resolve) => setTimeout(resolve, 500));
  //   return NextResponse.json({ serviceItems: mockServiceItems });
  // }

  // 1. Workerに転送するためのパスを構築する
  // context を経由して params にアクセス
  const { proxy } = await context.params; // await を使って展開
  const path = proxy?.[0]; //文字列で格納されているため悪意のあるJSコードは実行されない(URLエンコード（encodeURIComponent(path)）は不要)

  // 2. パスの構造と内容を厳密にチェック
  // まず、型を絞り込むための型ガード関数を作成する(isでboolean判定している)
  const isAllowedPath = (p: string | undefined): p is AllowedApiPath => {
    // as any を使って一時的に型チェックを回避し、includesで存在確認を行う
    if (!p) return false;
    // `ALLOWED_API_PATHS` をただの文字列配列として includes に渡すことで、any を回避する
    return (ALLOWED_API_PATHS as readonly string[]).includes(p);
  };

  const isValidPath =
    proxy?.length === 1 && // パスは単一セグメントであること(api/test/test等はNG)
    isAllowedPath(path); // 型ガード関数で、pathが許可リストの値であることを検証

  if (!isValidPath) {
    return new NextResponse("Forbidden: Invalid API path", { status: 403 });
  }

  //const path = proxy?.join("/") ?? ""; // 安全にパス生成
  // Worker側で basePath が "/api" に設定されているので、ここでも /api/ を含める
  const workerUrl = `${WORKER_URL}/api/${path}`;

  // ログ用
  // console.log("[proxy handler] path:", path);
  // console.log("[proxy handler] headers:", request.headers);

  // 2. 転送するリクエストのオプションを準備
  // fetchリクエストに含めるヘッダーを作成
  const headers = new Headers();
  const fetchOptions: RequestInit = {
    method: request.method, // 元のリクエストメソッドを使用
    headers: headers,
    // @ts-expect-error - `duplex` is a valid option in Node.js fetch
    duplex: "half", //リクエストとレスポンスの双方向通信を可能にするための設定(Node.js v18以降で推奨)。このオプションがないと、一部の環境（特にNode.js v18以降やVercelのEdge Runtimeなど）で「リクエストボディを送信している最中はレスポンスを受け取れない」という制約により、エラーが発生することがあるみたい。
  };

  // 3. ボディを持つ可能性のあるメソッドの場合、ボディとContent-Typeを転送する
  if (request.method !== "GET" && request.method !== "HEAD") {
    const contentType =
      request.headers.get("Content-Type") || "application/json";
    if (contentType) {
      headers.append("Content-Type", contentType);
    }
    fetchOptions.body = await request.text(); // or request.blob(), request.arrayBuffer() etc.
  }

  // 4. 認証ヘッダーなどを準備する
  headers.append("Authorization", `Bearer ${WORKER_API_SECRET}`);

  try {
    // 5. Workerへリクエストを転送
    const response = await fetch(workerUrl, fetchOptions);

    // 6. Workerからのレスポンスをクライアントにそのまま返す(エラーも含めて)
    const responseBody = await response.text();
    const responseHeaders = new Headers(response.headers);
    // Workerからの一部のレスポンスを削除（Vercel/Next.jsが自動付与するため）
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");
    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(`Error proxying to worker at ${workerUrl}:`, error);
    return new NextResponse("Internal Server Error while proxying to worker", {
      status: 500,
    });
  }
}
// POST, GET, PUTなど、転送したいHTTPメソッドをすべて同じハンドラに渡す
// クライアントがGETでリクエストし、Worker側がPOSTにしか対応していない場合、
// Workerが返す404 Not Foundがそのままクライアントに返る。これはプロキシとして正しい挙動。
export { handler as POST, handler as GET, handler as PUT, handler as DELETE };
