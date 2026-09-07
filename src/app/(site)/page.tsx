import GridOverlay from "@/components/layout/GridOverlay";
import StatusBadge from "@/components/layout/StatusBadge";
import Ticker from "@/components/layout/Ticker";
import WindowFrame from "@/components/layout/WindowFrame";
import ChaosSection from "@/components/sections/ChaosSection";
import ContactSection from "@/components/sections/ContactSection";
import DemoBlock from "@/components/sections/DemoBlock";
import PortfolioSection from "@/components/sections/PortfolioSection";
import SectionTag from "@/components/sections/SectionTag";
import SistemaSection from "@/components/sections/SistemaSection";
import { sectionProps } from "@/components/sections/sections";
import styles from "./page.module.css";

const TICKER_LEAD = "SI VOS FRENAS Y TU NEGOCIO SE DETIENE CON VOS, ";
const TICKER_EMPHASIS =
  "ESTÁS SOSTENIENDO A PULSO LO QUE PODRÍA SOSTENER UN SISTEMA";

export default function HomePage() {
  return (
    <>
      <main className={styles.hero} {...sectionProps("hero")}>
        <SectionTag section="hero" />
        <GridOverlay />        <StatusBadge variant="hero" className={styles.heroStatus} />
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

      <section className={styles.tickerWrap} {...sectionProps("ticker")}>
        <SectionTag section="ticker" tone="light" />
        <Ticker lead={TICKER_LEAD} emphasis={TICKER_EMPHASIS} />
      </section>
      <DemoBlock />
      <ChaosSection />
      <ContactSection />
      <SistemaSection />
      <PortfolioSection />
    </>
  );
}
