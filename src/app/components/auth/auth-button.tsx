"use client";

import { SignInButton, useAuth, UserButton } from "@clerk/nextjs";
import Link from "next/link";

// パフォーマンスが問題になった場合、memo化を検討してください。
// 現状では、レンダリングコストが低く、不要なオーバーヘッドを避けるためmemo化していません。
const AuthButton = () => {
  // セッション情報はこれで取得
  const { userId } = useAuth();

  if (userId) {
    return (
      <UserButton
        appearance={{
          elements: {
            avatarBox: "h-10 w-10",
          },
        }}
      />
    );
  }

  // mode="modal" でモーダル表示にする
  return (
    <>
      <button>
        <Link
          href={process.env.NEXT_PUBLIC_LINE_ADD_URL!}
          target="_blank"
          rel="noopener"
        >
          友だち追加する
        </Link>
      </button>
      <SignInButton
        mode="modal"
        fallbackRedirectUrl={"/dashboard"}
        forceRedirectUrl={"/dashboard"}
      >
        <button>LINEログイン</button>
      </SignInButton>
    </>
  );
};

export default AuthButton;
