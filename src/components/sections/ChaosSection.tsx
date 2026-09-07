"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import SectionTag from "./SectionTag";
import { sectionProps } from "./sections";
import shared from "./shared.module.css";
import styles from "./ChaosSection.module.css";

const TASKS = [
  "Mail urgente",
  "WhatsApp x12",
  "Factura pendiente",
  "Reunión sin agenda",
  "Cliente sin seguimiento",
  "Excel roto",
  "Cobranza manual",
  "Plantilla perdida",
] as const;

const FLOW = [
  { icon: "🤖", label: "BOT RECIBE", dot: "rose" },
  { icon: "⚡", label: "CLASIFICA AUTO", dot: "yellow" },
  { icon: "✅", label: "VOS DESCANSÁS", dot: "yellow" },
  { icon: "💌", label: "RESPONDE", dot: "aqua" },
] as const;

type Phase = "intro" | "playing" | "done";

type Bubble = {
  id: number;
  label: string;
  x: number;
  y: number;
};

export default function ChaosSection() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [timeLeft, setTimeLeft] = useState(30);
  const [resolved, setResolved] = useState(0);
  const [lost, setLost] = useState(0);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const idRef = useRef(0);

  const spawnBubble = useCallback(() => {
    const label = TASKS[Math.floor(Math.random() * TASKS.length)];
    const bubble: Bubble = {
      id: idRef.current++,
      label,
      x: 8 + Math.random() * 72,
      y: 18 + Math.random() * 52,
    };
    setBubbles((current) => [...current.slice(-5), bubble]);
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;

    const tick = window.setInterval(() => {
      setTimeLeft((value) => {
        if (value <= 1) {
          window.clearInterval(tick);
          setPhase("done");
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    const spawn = window.setInterval(spawnBubble, 1100);
    spawnBubble();

    return () => {
      window.clearInterval(tick);
      window.clearInterval(spawn);
    };
  }, [phase, spawnBubble]);

  useEffect(() => {
    if (phase !== "playing") return;

    const expire = window.setInterval(() => {
      setBubbles((current) => {
        if (current.length === 0) return current;
        setLost((value) => value + 1);
        return current.slice(1);
      });
    }, 2200);

    return () => window.clearInterval(expire);
  }, [phase]);

  function startGame() {
    idRef.current = 0;
    setTimeLeft(30);
    setResolved(0);
    setLost(0);
    setBubbles([]);
    setPhase("playing");
  }

  function popBubble(id: number) {
    setBubbles((current) => current.filter((bubble) => bubble.id !== id));
    setResolved((value) => value + 1);
  }

  return (
    <section className={styles.section} {...sectionProps("caos")}>
      <SectionTag section="caos" />
      <img className={styles.dino} src="/assets/recursos-graficos/dino.svg" alt="" width={80} height={80} />
      <span className={styles.bang} aria-hidden="true">
        ( ! _ ! )
      </span>

      <div className={styles.inner}>
        <p className={styles.eyebrow}>Sistemas a medida</p>
        <h2 className={styles.title}>Escapá del caos</h2>
        <p className={styles.subtitle}>
          Así se siente operar un negocio sin arquitectura. 30 segundos contados.
        </p>

        <div className={styles.window}>
          <div className={styles.windowBar}>
            <span /><span /><span />
          </div>

          <div className={styles.stats}>
            <span>Resueltos: {resolved}</span>
            <span>Perdidos: {lost}</span>
            <span>Tiempo: {timeLeft}s</span>
          </div>

          <div className={styles.stage}>
            {phase === "intro" ? (
              <div className={styles.intro}>
                <p className={styles.introTitle}>Sin sistema todo es urgente.</p>
                <p className={styles.highlight}>Hacé tap en cada tarea antes de que se acumule.</p>
                <p className={styles.highlight}>Este es tu lunes sin arquitectura.</p>
                <button type="button" className={`${shared.btnOrange} ${styles.startBtn}`} onClick={startGame}>
                  Empezar
                </button>
              </div>
            ) : null}

            {phase === "playing" ? (
              <>
                <p className={styles.playHint}>Tocá cada burbuja</p>
                {bubbles.map((bubble) => (
                  <button
                    key={bubble.id}
                    type="button"
                    className={styles.bubble}
                    style={{ left: `${bubble.x}%`, top: `${bubble.y}%` }}
                    onClick={() => popBubble(bubble.id)}
                  >
                    {bubble.label}
                  </button>
                ))}
              </>
            ) : null}

            {phase === "done" ? (
              <div className={styles.done}>
                <p className={styles.doneTitle}>Así se siente.</p>
                <p className={styles.doneText}>
                  No es que trabajás mal. Es que nadie diseñó el sistema que necesitás.
                </p>
                <p className={styles.modeTag}>Ahora, modo sistema</p>
                <div className={styles.flow}>
                  {FLOW.map((step) => (
                    <div key={step.label} className={styles.flowStep}>
                      <span className={styles.flowDot} data-color={step.dot} />
                      <span>{step.icon}</span>
                      <span>{step.label}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.doneActions}>
                  <Link href="/#contacto" className={`${shared.btnOrange} ${styles.actionBtn}`}>
                    Ver mi sistema
                  </Link>
                  <button type="button" className={`${shared.btnGhost} ${styles.actionBtn}`} onClick={startGame}>
                    Jugar de nuevo
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
