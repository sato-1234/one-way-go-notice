"use client";

import { SignInButton, useAuth, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import React from "react";

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
  // 基本は強制ダイレクトの「forceRedirectUrl」を記述すればよいみたい。
  return (
    <>
      <button>
        <Link
          href={process.env.NEXT_PUBLIC_LINE_ADD_URL || "/"}
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
