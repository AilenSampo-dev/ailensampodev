"use client";

import { FormEvent, useEffect, useState } from "react";
import SectionTag from "./SectionTag";
import { sectionProps } from "./sections";
import shared from "./shared.module.css";
import styles from "./SistemaSection.module.css";

const BARS = [
  { id: "cafe", label: "café", pct: 96, color: "#f656bf" },
  { id: "codigo", label: "código", pct: 58, color: "#abe3d2" },
  { id: "paciencia", label: "paciencia de la dev", pct: 22, color: "#6882eb" },
] as const;

const CHAT: Record<string, string> = {
  que: "Algo que hace que tu negocio funcione cuando vos no estás mirando. Pronto.",
  mucho: "No podemos revelar detalles, pero involucra menos Excel y más magia.",
  secreto:
    "Confidencial: estoy construyendo este sitio mientras construyo los de mis clientes. La arquitecta también necesita su propio sistema.",
};

const CELLS = 12;

export default function SistemaSection() {
  const [message, setMessage] = useState("");
  const [bars, setBars] = useState<Record<string, number>>({ cafe: 0, codigo: 0, paciencia: 0 });
  const [email, setEmail] = useState("");

  useEffect(() => {
    const timers: number[] = [];

    BARS.forEach((bar, index) => {
      const target = Math.round((bar.pct / 100) * CELLS);
      timers.push(
        window.setTimeout(() => {
          let filled = 0;
          const interval = window.setInterval(() => {
            filled += 1;
            setBars((current) => ({ ...current, [bar.id]: filled }));
            if (filled >= target) window.clearInterval(interval);
          }, 65);
        }, 300 + index * 400)
      );
    });

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  function handleChat(key: keyof typeof CHAT) {
    setMessage(CHAT[key]);
  }

  function handleWaitlist(event: FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    window.location.href = `mailto:hola@ailensampo.com?subject=Waitlist&body=${encodeURIComponent(email)}`;
  }

  return (
    <section className={`${styles.section} ${shared.gridBlue}`} {...sectionProps("sistema")}>
      <SectionTag section="sistema" />
      <div className={styles.inner}>
        <h2 className={styles.title}>
          No es magia
          <br />
          es arquitectura digital
        </h2>

        <div className={styles.terminal}>
          <div className={styles.terminalBar}>
            <span /><span /><span />
            <p>Proyectos</p>
          </div>

          <div className={styles.terminalBody}>
            <p className={styles.prompt}>&gt; Estado del proyecto</p>

            {BARS.map((bar) => (
              <div key={bar.id} className={styles.barRow}>
                <span className={styles.barLabel}>[ █ ] {bar.label}:</span>
                <span className={styles.barTrack} style={{ color: bar.color }}>
                  {"█".repeat(bars[bar.id])}
                  <span className={styles.barEmpty}>{"█".repeat(CELLS - bars[bar.id])}</span>
                </span>
                <span className={styles.barPct}>{Math.round((bars[bar.id] / CELLS) * 100)}%</span>
              </div>
            ))}

            {message ? (
              <div className={styles.bubble}>
                <img src="/assets/recursos-graficos/face-wink.svg" alt="" width={36} height={36} />
                <p>&gt; {message}</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className={styles.chips}>
          <button type="button" className={styles.chip} onClick={() => handleChat("que")}>
            ¿Qué estás construyendo?
          </button>
          <button type="button" className={styles.chip} onClick={() => handleChat("mucho")}>
            ¿Falta mucho?
          </button>
          <button type="button" className={styles.chip} onClick={() => handleChat("secreto")}>
            Contame un secreto
          </button>
        </div>

        <form className={styles.waitlist} onSubmit={handleWaitlist}>
          <img src="/assets/recursos-graficos/mail.svg" alt="" width={40} height={40} />
          <p>Avísame cuando esté listo</p>
          <input
            type="email"
            placeholder="tumail@gmail.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <button type="submit" className={shared.btnPrimary}>
            Unirme
          </button>
        </form>
      </div>
    </section>
  );
}
