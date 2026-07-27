import type { ReactNode } from "react";
import styles from "./WindowFrame.module.css";

type WindowFrameProps = {
  children: ReactNode;
  variant?: "light" | "dark";
  className?: string;
  buzz?: boolean;
};

export default function WindowFrame({
  children,
  variant = "light",
  className = "",
  buzz = false,
}: WindowFrameProps) {
  return (
    <div
      className={`${styles.frame} ${styles[variant]} ${buzz ? "anim-messenger-buzz" : ""} ${className}`.trim()}
    >
      <div className={styles.titleBar}>
        <span className={styles.dot} data-color="yellow" />
        <span className={styles.dot} data-color="rose" />
        <span className={styles.dot} data-color="aqua" />
      </div>
      <div className={styles.body}>{children}</div>
    </div>
  );
}
