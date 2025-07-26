import styles from "./page.module.css";
import Image from "next/image";
import Header from "./components/header/header";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Header />
      <main className={styles.home}>
        <div className={styles.responsiveImage}>
          <Image
            src="/home/img1.png"
            alt="片道GO LINE通知"
            width="1408"
            height="768"
            priority
          />
        </div>
        <h2>やり方</h2>
        <p>
          片道GO通知を友だち追加　→　LINEログイン　→　指定条件を入力　→　条件にマッチする片道レンタカーが表示されたら、LINEで通知いたします。
          ※携帯の設定でLINE通知をONにしてください。友だち追加しないと通知はとどきませんので事前に追加をお願い致します。
          <span>
            また、ログインした場合、
            <Link href="/termsofuse">利用規約</Link>
            に同意したものとみなしますので、利用規約をご確認上ご利用ください。
          </span>
        </p>
        <div className="link">
          <Link href="/dashboard">指定条件を登録</Link>
        </div>
      </main>
    </>
  );
}
