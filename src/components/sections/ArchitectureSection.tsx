import { WHATSAPP_URL, whatsappUrl } from "@/lib/contacto";
import ArchitecturePdfForm from "./ArchitecturePdfForm";
import SectionTag from "./SectionTag";
import type { GeneratedArchitecture } from "./demoTasks";
import { sectionProps } from "./sections";
import shared from "./shared.module.css";
import styles from "./ArchitectureSection.module.css";

type ArchitectureSectionProps = {
  task: string;
  /** null mientras se genera */
  architecture: GeneratedArchitecture | null;
  onRetry: () => void;
};

const LOADING_SLOTS = ["rose", "yellow", "aqua"] as const;

export default function ArchitectureSection({ task, architecture, onRetry }: ArchitectureSectionProps) {
  const loading = architecture === null;
  const charla = architecture?.tipo === "charla";

  return (
    <section className={`${styles.section} ${shared.gridWhite}`} {...sectionProps("arquitectura")}>
      <SectionTag section="arquitectura" />
      <div className={styles.panel}>
        <p className={styles.panelEyebrow}>
          {loading ? "Armando tu arquitectura para:" : charla ? "Lo que me contaste:" : "Arquitectura generada para:"}
        </p>
        <div className={styles.query}>&ldquo;{task}&rdquo;</div>

        <div className={styles.cards} aria-live="polite" aria-busy={loading}>
          {charla ? (
            <div className={styles.charla}>
              <p>{architecture?.nota}</p>
              <a className={styles.charlaBtn} href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <span aria-hidden="true">🎙️</span> Mandame un audio
              </a>
            </div>
          ) : loading
            ? LOADING_SLOTS.map((dot, i) => (
                <article
                  key={dot}
                  className={`${styles.card} ${styles.cardLoading}`}
                  style={{ animationDelay: `${i * 0.18}s` }}
                  aria-hidden="true"
                >
                  <span className={styles.cardDot} data-color={dot} />
                  <span className={styles.skeleton} style={{ width: "30%" }} />
                  <span className={styles.skeleton} style={{ width: "70%", height: "1.1rem" }} />
                  <span className={styles.skeleton} style={{ width: "90%" }} />
                </article>
              ))
            : architecture.cards.map((card, i) => (
                <article
                  key={`${card.label}-${i}`}
                  className={`${styles.card} ${styles.cardIn}`}
                  style={{ animationDelay: `${i * 0.15}s` }}
                >
                  <span className={styles.cardDot} data-color={card.dot} aria-hidden="true" />
                  <p className={styles.cardLabel}>{card.label}</p>
                  <h3>{card.title}</h3>
                  <p>{card.desc}</p>
                </article>
              ))}
        </div>
        {architecture?.tipo === "mixta" && architecture.nota ? <p className={styles.nota}>{architecture.nota}</p> : null}
      </div>

      <div className={styles.value}>
        <h2 className={styles.valueTitle}>
          <span>De manual</span>
          <span className={styles.valueMark} role="img" aria-label="a" />
          <span>automático</span>
        </h2>
        <p className={styles.valueText}>
          {charla
            ? "Cada negocio es distinto: por eso primero escucho cómo funciona el tuyo y después construyo."
            : architecture?.source === "ia"
            ? "Esta arquitectura la armó una IA en segundos, con módulos que construyo. Imaginate lo que hacemos en 4 semanas."
            : "Este boceto se armó en un clic. Imaginate lo que construimos mirando tu negocio por dentro."}
        </p>
        {architecture && !charla ? <ArchitecturePdfForm key={architecture.consultaId} consultaId={architecture.consultaId} /> : null}
      </div>

      <div className={styles.cta}>
        {/* Abre WhatsApp con la arquitectura que generó: llega con contexto */}
        <a
          href={
            architecture && !charla
              ? whatsappUrl(
                  `Hola Ailén, quiero este sistema para "${task}": ${architecture.cards
                    .map((card) => card.title)
                    .join(" + ")}. ¿Lo charlamos?`,
                )
              : WHATSAPP_URL
          }
          target="_blank"
          rel="noopener noreferrer"
          className={shared.btnPrimary}
        >
          {charla ? "Charlemos" : "Quiero este sistema"}
        </a>
        <button type="button" className={`${shared.btnGhost} ${styles.ctaBtn}`} onClick={onRetry}>
          Probar otra tarea
        </button>
      </div>
    </section>
  );
}
