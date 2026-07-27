"use client";

import styles from "./StatusBadge.module.css";

type StatusBadgeProps = {
  variant?: "header" | "hero";
  className?: string;
};

export default function StatusBadge({
  variant = "header",
  className = "",
}: StatusBadgeProps) {
  return (
    <div
      className={`${styles.badge} ${styles[variant]} ${className}`.trim()}
      role="status"
    >
      <span className={`${styles.dot} anim-status-pulse`} aria-hidden="true" />
      <span className={styles.text}>Disponible para nuevos proyectos</span>
    </div>
  );
}
