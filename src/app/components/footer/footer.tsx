import { COMMON } from "@/app/config/common";
import styles from "./footer.module.css";
import Link from "next/link";

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
