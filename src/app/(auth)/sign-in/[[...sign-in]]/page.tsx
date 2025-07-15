"use client";

import { useAuth, SignIn } from "@clerk/nextjs";
import Loading from "../../../components/atoms/loading";

export default function SignInPage() {
  // 1. useClerkフックを呼び出し、isLoadedプロパティを取得
  const { isLoaded } = useAuth();
  if (!isLoaded) {
    return (
      <div style={{ marginTop: "20px" }}>
        <Loading />
      </div>
    );
  }
  return (
    <>
      <SignIn />
    </>
  );
}
