import GridOverlay from "@/components/layout/GridOverlay";
import StatusBadge from "@/components/layout/StatusBadge";
import Ticker from "@/components/layout/Ticker";
import WindowFrame from "@/components/layout/WindowFrame";
import styles from "./page.module.css";

const TICKER_LEAD = "SI VOS FRENAS Y TU NEGOCIO SE DETIENE CON VOS, ";
const TICKER_EMPHASIS =
  "ESTÁS SOSTENIENDO A PULSO LO QUE PODRÍA SOSTENER UN SISTEMA";

export default function HomePage() {
  return (
    <>
      <main className={styles.hero}>
        <GridOverlay />
        <StatusBadge variant="hero" className={styles.heroStatus} />
        <div className={styles.scene}>
          <WindowFrame variant="light" className={styles.windowLight} buzz>
            Si vos frenas
            <br />
            y tu negocio
            <br />
            se detiene
            <br />
            con vos...
          </WindowFrame>

          <div className={`${styles.windowDarkWrap} anim-messenger-buzz-delayed`}>
            <WindowFrame variant="dark" className={styles.windowDark}>
              Estás sosteniendo a
              <br />
              pulso lo que podría
              <br />
              sostener un sistema
            </WindowFrame>

            <img
              className={styles.warning}
              src="/assets/recursos-graficos/important.svg"
              alt=""
              width={130}
              height={130}
            />

            <span className={styles.bangs} aria-hidden="true">
              (!!)
            </span>
          </div>
        </div>
      </main>

      <Ticker lead={TICKER_LEAD} emphasis={TICKER_EMPHASIS} />
    </>
  );
}
