import Link from "next/link";
import SectionTag from "./SectionTag";
import { sectionProps } from "./sections";
import shared from "./shared.module.css";
import styles from "./ArchitectureSection.module.css";

const CARDS = [
  {
    label: "BOT",
    title: "Captura automática",
    desc: "Recibe y clasifica sin intervención",
    dot: "rose",
  },
  {
    label: "FLOW",
    title: "Flujo de respuesta",
    desc: "Responde según reglas definidas",
    dot: "yellow",
  },
  {
    label: "CRM",
    title: "Registro en sistema",
    desc: "Historial y seguimiento centralizado",
    dot: "aqua",
  },
] as const;

type ArchitectureSectionProps = {
  task: string;
  onRetry: () => void;
};

export default function ArchitectureSection({ task, onRetry }: ArchitectureSectionProps) {
  return (
    <section className={styles.section} {...sectionProps("arquitectura")}>
      <SectionTag section="arquitectura" />
      <div className={styles.panel}>
        <p className={styles.panelEyebrow}>Arquitectura generada para:</p>
        <div className={styles.query}>&ldquo;{task}&rdquo;</div>

        <div className={styles.cards}>
          {CARDS.map((card) => (
            <article key={card.label} className={styles.card}>
              <span className={styles.cardDot} data-color={card.dot} aria-hidden="true" />
              <p className={styles.cardLabel}>{card.label}</p>
              <h3>{card.title}</h3>
              <p>{card.desc}</p>
            </article>
          ))}
        </div>
      </div>

      <div className={`${styles.value} ${shared.gridWhite}`}>
        <h2 className={styles.valueTitle}>
          De manual <em>a</em> automático
        </h2>
        <p className={styles.valueText}>
          Este diagrama lo armó una IA en segundos. Imaginate lo que podemos construir en 4 semanas.
        </p>
      </div>

      <div className={styles.cta}>
        <Link href="/#contacto" className={shared.btnPrimary}>
          Quiero este sistema
        </Link>
        <button type="button" className={`${shared.btnGhost} ${styles.ctaBtn}`}>
          Descargar mi arquitectura
        </button>
        <button type="button" className={`${shared.btnGhost} ${styles.ctaBtn}`} onClick={onRetry}>
          Probar otra tarea
        </button>
      </div>
    </section>
  );
}
