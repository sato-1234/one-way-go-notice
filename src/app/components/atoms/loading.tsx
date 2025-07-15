import { memo } from "react";
import styles from "./loading.module.css";

const loading = memo(() => {
  return (
    <div className={styles.div}>
      <div className={styles.loaderText} data-testid="loader-text">
        Loading...
      </div>
      <div className={styles.loader}></div>
    </div>
  );
});

export default loading;
