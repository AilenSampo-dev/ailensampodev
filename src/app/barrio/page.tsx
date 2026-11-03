import Link from "next/link";
import Header, { Footer } from "./Header";
import Directorio from "./Directorio";
import styles from "./barrio.module.css";

export default function BarrioPage() {
  return (
    <>
      <Header />
      <Directorio />

      <section id="como" className={styles.band}>
        <div className={`${styles.container} ${styles.section}`}>
          <h2 className={styles.h2} style={{ textAlign: "center" }}>Así funciona</h2>
          <div className={styles.steps}>
            <div className={styles.step}>
              <span className={`${styles.stepNum} ${styles.pixel}`}>01</span>
              <h3 className={styles.stepTitle}>Buscás por rubro o palabra</h3>
              <p className={styles.stepText}>
                Lo mismo que en los grupos de WhatsApp, pero ordenado: buscás rubro o palabra y aparece al toque.
              </p>
            </div>
            <div className={styles.step}>
              <span className={`${styles.stepNum} ${styles.pixel}`}>02</span>
              <h3 className={styles.stepTitle}>Hablás directo con quien lo hace</h3>
              <p className={styles.stepText}>Un toque y se abre su WhatsApp. El trato es entre vecinos.</p>
            </div>
            <div className={styles.step}>
              <span className={`${styles.stepNum} ${styles.pixel}`}>03</span>
              <h3 className={styles.stepTitle}>Siempre al día</h3>
              <p className={styles.stepText}>
                Cada emprendimiento confirma por mail que sigue activo. Si no, se oculta solo. Si varios vecinos reportan una ficha, se pausa sola.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.container} ${styles.section}`}>
        <div className={styles.sumate}>
          <div className={styles.sumateText}>
            <h2 className={styles.h2}>¿Vendés o hacés algo en el barrio?</h2>
            <p>
              Cargalo una vez y que te encuentren cuando te necesitan, también quien se sumó tarde al chat o no alcanzó a ver tu mensaje en el grupo.
            </p>
          </div>
          <div className={styles.sumateCard}>
            <p>Tu ficha con fotos, horarios, entrega y formas de pago. Lista en 5 minutos, desde el celu.</p>
            <Link href="/barrio/alta" className={styles.btnDark} style={{ minHeight: 48 }}>Cargar mi emprendimiento</Link>
            <Link href="/barrio/panel" style={{ fontWeight: 700, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
              Ya estoy: editar mi ficha
            </Link>
            <p className={styles.muted}>Gratis para vecinos. Se publica al instante.</p>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
