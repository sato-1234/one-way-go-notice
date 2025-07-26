import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import {
  type NextRequest,
  type NextFetchEvent,
  NextResponse,
} from "next/server";

// Clerkの保護から除外したい、独自のAPIキーで保護されたAPIルートのリスト
// api処理はcrosやAPI_keyでセキュリティ対策すること
const isPublicApiRoute = [
  "/api/scrape",
  // 他に増えたらここに追加。例: '/api/health'
];

// ログイン済みユーザーのみにアクセスさせたいルートを定義
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)", // /dashboard とその下の全ページ
]);

// 全ユーザーにアクセス可能な公開ルートを定義
const isPublicRoute = createRouteMatcher(["/sign-in(.*)"]);

// export default clerkMiddleware(async (auth, req) => {
export default function middleware(req: NextRequest, event: NextFetchEvent) {
  const { pathname } = req.nextUrl;

  // 現在のリクエストパスが、公開APIルートのリストに含まれているかを確認
  if (isPublicApiRoute.some((route) => pathname.startsWith(route))) {
    // 認証処理なしで、APIリクエストをそのまま次に渡す
    return NextResponse.next();
  }

  // 上記以外,clerkMiddlewareを呼び出す
  return clerkMiddleware(async (auth, req) => {
    const { userId } = await auth();

    // ユーザーがログイン済みで、かつ公開ページにアクセスしようとした場合
    if (userId && isPublicRoute(req)) {
      // 認証処理なしで、/dashboardにリダイレクトさせる
      const dashboardUrl = new URL("/dashboard", req.url);
      return NextResponse.redirect(dashboardUrl);
    }

    // 認証が必要なページの場合、認証処理する
    // 認証されていない場合「sign-in」にリダイレクト
    if (isProtectedRoute(req)) {
      await auth.protect();
    }

    // 上記のどのルールにも当てはまらない場合は、リクエストをそのまま通す（明示記載）
    return NextResponse.next();
  })(req, event); // 即座に実行するために(req)を付けると構文エラー
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    //"/api((?!/scrape).*)",
    "/(api|trpc)(.*)",
  ],
};
