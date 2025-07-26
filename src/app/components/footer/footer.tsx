import { COMMON } from "@/config/common";
import styles from "./footer.module.css";
import Link from "next/link";

// パフォーマンスが問題になった場合、memo化を検討してください。
// 現状では、レンダリングコストが低く、不要なオーバーヘッドを避けるためmemo化していません。
const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div>
        <Link href="/termsofuse">利用規約</Link>｜
        <Link href="/privacy">プライバシーポリシー</Link>
      </div>
      <p>
        <small>{COMMON.COPYRIGHT}</small>
      </p>
    </footer>
  );
};

export default Footer;
