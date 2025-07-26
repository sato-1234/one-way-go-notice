import styles from "./loading.module.css";

// パフォーマンスが問題になった場合、memo化を検討してください。
// 現状では、レンダリングコストが低く、不要なオーバーヘッドを避けるためmemo化していません。
const Loading = () => {
  return (
    <div className={styles.div}>
      <div className={styles.loaderText} data-testid="loader-text">
        Loading...
      </div>
      <div className={styles.loader}></div>
    </div>
  );
};

export default Loading;
