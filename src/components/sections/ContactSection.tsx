import Link from "next/link";
import WindowFrame from "@/components/layout/WindowFrame";
import SectionTag from "./SectionTag";
import { sectionProps } from "./sections";
import styles from "./ContactSection.module.css";

export default function ContactSection() {
  return (
    <section className={styles.section} {...sectionProps("contacto")}>
      <SectionTag section="contacto" />
      <img className={styles.warning} src="/assets/recursos-graficos/important.svg" alt="" width={72} height={72} />
      <span className={styles.smiley} aria-hidden="true">
        ( ^_− )
      </span>

      <div className={styles.scene}>
        <WindowFrame variant="light" className={styles.windowLight}>
          Próximo paso
        </WindowFrame>

        <WindowFrame variant="dark" className={styles.windowDark}>
          Llegaste hasta acá con lo que tenías,
          <br />
          ahora construimos lo que falta.
        </WindowFrame>
      </div>

      <div className={styles.actions}>
        <Link href="mailto:hola@ailensampo.com" className={styles.cta}>
          Escribime
        </Link>
      </div>
    </section>
  );
}
