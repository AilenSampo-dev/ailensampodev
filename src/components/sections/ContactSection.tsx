import { WHATSAPP_URL } from "@/lib/contacto";
import { DemoFaceWink } from "./DemoFaces";
import ContactActions from "./ContactActions";
import SectionTag from "./SectionTag";
import { sectionProps } from "./sections";
import styles from "./ContactSection.module.css";

// Contacto — réplica de Canva "Sitio web" DAHM0M2xh8E, pág. 6 (el footer es un componente aparte).
// El mockup no tiene botón: la ventana "Próximo paso" abre WhatsApp ("mandale un audio a tu sistema roto").
const CONTACT_HREF = WHATSAPP_URL;

export default function ContactSection() {
  return (
    <section className={styles.section} {...sectionProps("contacto")}>
      <SectionTag section="contacto" />

      <div className={styles.scene}>
        {/* Inclinación en el contenedor; el zumbido (mismo que el hero) en la ventana de adentro */}
        <div className={styles.windowLight}>
          <a
            className={`${styles.frame} ${styles.frameLight} anim-messenger-buzz`}
            href={CONTACT_HREF}
            aria-label="Próximo paso: mandame un audio por WhatsApp"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className={styles.bar} aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className={styles.lightText}>
              Próximo
              <br />
              paso
            </span>
          </a>
        </div>

        <img
          className={styles.warning}
          src="/assets/recursos-graficos/important.svg"
          alt=""
          width={160}
          height={160}
        />

        <div className={styles.windowDark}>
          <div className={`${styles.frame} ${styles.frameDark} anim-messenger-buzz-delayed`}>
            <span className={styles.bar} aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <p className={styles.darkText}>
              Llegaste hasta acá
              <br />
              con lo que tenías, ahora
              <br />
              construimos lo que falta.
            </p>
          </div>
        </div>

        {/* Misma carita animada que la demo (guiña cada 3,6 s), en amarillo */}
        <DemoFaceWink className={styles.wink} />
      </div>

      <ContactActions />
    </section>
  );
}
