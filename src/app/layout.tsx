import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { jaJP } from "@clerk/localizations";
import "./globals.css";

import { COMMON } from "../config/common";
import Footer from "./components/footer/footer";

// フォントオプション設定
const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  preload: true,
});

export const metadata: Metadata = {
  title: COMMON.TITLE,
  description: COMMON.DESCRIPTION,
  icons: {
    // ブラウザタブ用のアイコン
    icon: "icon/icon.png", // public/icon.png を指す
    // Appleデバイスのホーム画面用アイコン
    apple: "icon/icon.png", // 同じものを使い回す
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // afterSignOutUrlはサインアウト後のリダイレクト先。.envでは指定できない
  return (
    <ClerkProvider localization={jaJP} afterSignOutUrl={"/"}>
      <html lang="ja">
        <body className={`${notoSansJP.className} antialiased`}>
          {children}
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}
