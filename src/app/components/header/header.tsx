import { COMMON } from "@/app/config/common";
import AuthButton from "../auth/auth-button";

import styles from "./header.module.css";
import Link from "next/link";

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
