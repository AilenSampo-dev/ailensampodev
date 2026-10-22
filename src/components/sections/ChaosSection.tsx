"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ManualRound, { GAME_SECONDS, type ManualResult, type ManualStats } from "./ManualRound";
import SectionTag from "./SectionTag";
import { useDemoState } from "./demoStore";
import { matchDemoTag } from "./demoTasks";
import { sectionProps } from "./sections";
import styles from "./ChaosSection.module.css";

// "Escapá del caos": ronda manual (imposible) → glitch → modo sistema. Es solo un juego: no genera sistemas.
// Si la persona ya generó una arquitectura arriba, las cajas muestran sus módulos; si no, las del mockup.
// "Ver mi sistema" lleva a "Te lo demuestro". Diseño: Canva DAHM0M2xh8E págs. 4 y 5.

type Phase = "intro" | "manual" | "glitch" | "system";

const DEFAULT_STEPS = [
  { text: "🤖 Bot recibe", dot: "rose" },
  { text: "⚡ Clasifica auto", dot: "yellow" },
  { text: "💌 Responde", dot: "aqua" },
] as const;

const MODULE_EMOJI: Record<string, string> = {
  BOT: "🤖", INBOX: "📥", CRM: "🗂️", FLOW: "⚡", AGENDA: "📅", AVISOS: "🔔", PRESUPUESTOS: "🧾",
  PLANTILLAS: "📄", COBROS: "💰", ARCA: "🧾", STOCK: "📦", PEDIDOS: "🚚", TIENDA: "🛍️", PANEL: "📊",
  REPORTES: "📈", EQUIPO: "👥", ERP: "🧩", CAPTURA: "📥", BASE: "📚", REGISTRO: "🗂️", CAJA: "💰", ENTRADA: "📥",
};

const SYSTEM_MS = 5200;
const TOKEN_TONES = ["blue", "orange", "rose", "yellow", "aqua", "blue"] as const;

export default function ChaosSection() {
  const { task, architecture } = useDemoState();
  const [phase, setPhase] = useState<Phase>("intro");
  const [round, setRound] = useState(0);
  const [stats, setStats] = useState<ManualStats>({ resolved: 0, lost: 0, timeLeft: GAME_SECONDS });
  const [result, setResult] = useState<ManualResult | null>(null);
  const [systemCount, setSystemCount] = useState(0);
  const [activeStep, setActiveStep] = useState(-1);
  const [systemDone, setSystemDone] = useState(false);

  const weightTag = useMemo(() => (task ? matchDemoTag(task) : null), [task]);

  // Las cajas del modo sistema: los módulos de su arquitectura, o los del mockup.
  const steps = useMemo(() => {
    if (!architecture) return DEFAULT_STEPS;
    return architecture.cards.map((card) => ({
      text: `${MODULE_EMOJI[card.label] ?? "⚙️"} ${card.label}`,
      dot: card.dot,
    }));
  }, [architecture]);

  const start = useCallback(() => {
    setStats({ resolved: 0, lost: 0, timeLeft: GAME_SECONDS });
    setResult(null);
    setSystemCount(0);
    setActiveStep(-1);
    setSystemDone(false);
    setRound((r) => r + 1);
    setPhase("manual");
  }, []);

  const handleEnd = useCallback((res: ManualResult) => {
    setResult(res);
    setPhase("glitch");
  }, []);

  // glitch → modo sistema
  useEffect(() => {
    if (phase !== "glitch") return;
    const timer = window.setTimeout(() => setPhase("system"), 700);
    return () => window.clearTimeout(timer);
  }, [phase]);

  // modo sistema: las mismas tareas pasan por la cadena y se resuelven solas
  useEffect(() => {
    if (phase !== "system" || !result) return;
    const total = Math.max(result.total, 1);
    const startedAt = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - startedAt) / SYSTEM_MS);
      setSystemCount(Math.round(total * p));
      setActiveStep(p >= 1 ? 3 : Math.floor((now - startedAt) / 260) % 3);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setSystemDone(true);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, result]);

  // El juego no genera nada: lleva a "Te lo demuestro" para que la persona elija un botón o escriba lo que le pasa.
  function showMySystem() {
    document.getElementById("demo")?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      document.querySelector<HTMLInputElement>("#demo input")?.focus({ preventScroll: true });
    }, 700);
  }

  const visualPhase = phase === "system" ? "done" : phase;
  const statResolved = phase === "intro" ? "" : phase === "system" ? systemCount : stats.resolved;
  const statLost = phase === "intro" ? "" : phase === "system" ? 0 : stats.lost;
  const statTime = phase === "system" ? 0 : stats.timeLeft;

  return (
    <section className={styles.section} data-phase={visualPhase} {...sectionProps("caos")}>
      <SectionTag section="caos" />
      {phase !== "system" ? <span className={styles.glow} aria-hidden="true" /> : null}
      <img className={styles.dino} src="/assets/recursos-graficos/dino-recorte.svg" alt="" width={126} height={133} />
      <img
        className={styles.bang}
        src="/assets/recursos-graficos/face-admiracion-recorte.svg"
        alt=""
        width={114}
        height={70}
      />

      <div className={styles.inner}>
        <p className={styles.eyebrow}>Sistemas a medida</p>
        <h2 className={styles.title}>Escapá del caos</h2>
        <p className={styles.subtitle}>
          Así se siente operar un negocio sin arquitectura.
          <br />
          30 segundos contados.
        </p>
      </div>

      <div className={styles.window}>
        <div className={styles.windowBar} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <div className={styles.stats} aria-live="off">
          <span>Resueltos: {statResolved}</span>
          <span>Perdidos: {statLost}</span>
          <span className={phase === "manual" && statTime <= 5 ? styles.timeUrgent : undefined}>
            Tiempo: {statTime}s
          </span>
        </div>

        <div className={`${styles.stage} ${phase === "glitch" ? styles.glitch : ""}`}>
          {phase === "intro" ? (
            <div className={styles.intro}>
              <p className={styles.introTitle}>
                Sin sistema
                <br />
                todo es urgente.
              </p>
              <div className={styles.highlights}>
                <p className={styles.highlight}>Hacé click en cada tarea antes de que se acumule.</p>
                <p className={styles.highlight}>Este es tu lunes sin arquitectura.</p>
              </div>
              <button type="button" className={styles.startBtn} onClick={start}>
                Empezar
              </button>
            </div>
          ) : null}

          {phase === "manual" ? (
            <ManualRound key={round} weightTag={weightTag} onStats={setStats} onEnd={handleEnd} />
          ) : null}

          {phase === "system" && result ? (
            <div className={styles.done}>
              {result.tapado ? (
                <p className={styles.tapado}>Te tapó el lunes en {result.seconds} segundos.</p>
              ) : null}
              <p className={styles.doneTitle}>Así se siente.</p>
              <p className={styles.doneText}>
                No es que trabajás mal,
                <br />
                es que nadie diseñó el sistema que necesitás.
              </p>
              <p className={styles.modeTag}>Ahora, modo sistema</p>

              <div className={styles.flow}>
                {systemDone ? null : (
                  <div className={styles.track} aria-hidden="true">
                    {/* Tareas (con los colores de cada tipo) que entran y salen de cada módulo */}
                    {TOKEN_TONES.map((tone, i) => (
                      <span
                        key={i}
                        className={styles.token}
                        data-tone={tone}
                        style={{ animationDelay: `${i * 0.3}s` }}
                      />
                    ))}
                  </div>
                )}
                {steps.map((step, i) => (
                  <div key={step.text} className={styles.flowItem}>
                    <div className={`${styles.flowStep} ${activeStep === i ? styles.flowActive : ""}`}>
                      {step.text}
                      <span className={styles.flowDot} data-color={step.dot} aria-hidden="true" />
                    </div>
                    {i < steps.length - 1 ? (
                      <span className={styles.flowArrow} aria-hidden="true">
                        ➡️
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
              <div className={`${styles.flowStep} ${styles.flowRest} ${systemDone ? styles.flowActive : ""}`}>
                <span aria-hidden="true">✅</span> Vos descansás
                <span className={styles.flowDot} data-color="yellow" aria-hidden="true" />
              </div>

              {systemDone ? (
                <div className={styles.versus}>
                  <p>
                    <strong>Vos:</strong> {result.resolved} resueltas · {result.lost} perdidas
                  </p>
                  <p>
                    <strong>{architecture ? "Tu sistema" : "El sistema"}:</strong> {result.total} resueltas · 0
                    perdidas · 0 minutos tuyos
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {phase === "system" ? (
        <div className={styles.doneActions}>
          <button type="button" className={styles.actionPrimary} onClick={showMySystem}>
            Ver mi sistema
          </button>
          <button type="button" className={styles.actionGhost} onClick={start}>
            Jugar de nuevo
          </button>
        </div>
      ) : null}
    </section>
  );
}
