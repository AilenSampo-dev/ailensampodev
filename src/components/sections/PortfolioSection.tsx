import { projectsForMobile } from "@/data/projects";
import SectionTag from "./SectionTag";
import { sectionProps } from "./sections";
import styles from "./PortfolioSection.module.css";

const EXTERNAL = ["Sitio web", "GA4", "Automatizaciones", "Meta tags", "SEO básica"];
const INTERNAL = ["Bot · Captura automática", "Flow · Flujo de respuestas", "CRM · Sistema automatizado"];

export default function PortfolioSection() {
  const projects = projectsForMobile();

  return (
    <section className={styles.section} {...sectionProps("portfolio")}>
      <SectionTag section="portfolio" tone="light" />
      <div className={styles.diagram}>
        <div className={styles.diagramCol}>
          <p className={styles.diagramLabel}>&lt; sistema externo &gt;</p>
          <ul className={styles.list}>
            {EXTERNAL.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className={styles.diagramCol}>
          <p className={styles.diagramLabel}>&lt; arquitectura interna &gt;</p>
          <ul className={styles.list}>
            {INTERNAL.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.carouselWrap}>
        <p className={styles.carouselLabel}>Proyectos · deslizá</p>
        <div className={styles.carousel}>
          {projects.map((project) => (
            <a
              key={project.title}
              href={project.url}
              className={styles.card}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={project.title}
            >
              <span className={styles.cardBubble} style={{ background: project.color }}>
                <img src={project.image} alt="" loading="lazy" />
              </span>
              <span className={styles.cardTitle}>{project.title}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
