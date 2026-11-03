import type { Metadata } from "next";
import { VT323 } from "next/font/google";
import styles from "./barrio.module.css";

// Sección independiente del sitio: no usa el Nav ni el layout de (site).

const pixel = VT323({ weight: "400", subsets: ["latin"], variable: "--font-pixel", display: "swap" });

export const metadata: Metadata = {
  title: "Directorio del barrio — emprendimientos de vecinos",
  description: "Todos los emprendimientos del barrio, ordenados por rubro. Buscás, encontrás y escribís por WhatsApp.",
  // Modo demo: que no aparezca en Google hasta que esté en uso real.
  robots: { index: false, follow: false },
};

export default function BarrioLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`${styles.wrap} ${pixel.variable}`}>
      <div className={styles.demoBar} role="note">
        Modo demo · los emprendimientos son ejemplos
      </div>
      {children}
    </div>
  );
}
