import { COMMON } from "@/config/common";
import AuthButton from "../auth/auth-button";

import styles from "./header.module.css";
import Link from "next/link";

// パフォーマンスが問題になった場合、memo化を検討してください。
// 現状では、レンダリングコストが低く、不要なオーバーヘッドを避けるためmemo化していません。
const Header = () => {
  return (
    <header className={styles.header}>
      <h1>
        <Link href="/">{COMMON.TITLE}</Link>
      </h1>
      <nav>
        <AuthButton />
      </nav>
    </header>
  );
};

export default Header;
