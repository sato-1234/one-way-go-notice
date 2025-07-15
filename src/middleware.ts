import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// ログイン済みユーザーのみにアクセスさせたいルートを定義
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)", // /dashboard とその下の全ページ
]);

// 全ユーザーにアクセス可能な公開ルートを定義
const isPublicRoute = createRouteMatcher(["/sign-in(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // ユーザーがログイン済みで、かつ公開ページにアクセスしようとした場合
  if (userId && isPublicRoute(req)) {
    // /dashboardにリダイレクトさせる
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
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
