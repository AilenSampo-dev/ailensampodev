import type { SectionKey } from "./sections";
import { SECTIONS } from "./sections";
import styles from "./SectionTag.module.css";

type SectionTagProps = {
  section: SectionKey;
  tone?: "dark" | "light";
};

export default function SectionTag({ section, tone = "dark" }: SectionTagProps) {
  // Etiqueta de desarrollo: no se publica.
  if (process.env.NODE_ENV === "production") return null;

  const meta = SECTIONS[section];

  return (
    <span className={`${styles.tag} ${styles[tone]}`} title={`${meta.title} (mockup slide ${meta.slide})`}>
      {meta.label}
      <span className={styles.code}>{meta.code}</span>
    </span>
  );
}
