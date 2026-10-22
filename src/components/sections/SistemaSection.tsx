"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { CONTACT_EMAIL, WHATSAPP_URL } from "@/lib/contacto";
import BugReport from "./BugReport";
import { DemoFaceWink } from "./DemoFaces";
import { FloatingProjects, ProjectsCarousel } from "./ProjectBubbles";
import SectionTag from "./SectionTag";
import { sectionProps } from "./sections";
import shared from "./shared.module.css";
import styles from "./SistemaSection.module.css";

// "No es magia, es arquitectura digital" — réplica de Canva DAHM0M2xh8E pág. 7, con los globitos de
// proyectos de la landing flotando a los costados de la terminal "Proyectos".
// Contacto: 🎙️ audio por WhatsApp (principal) · ⚠ "reportá un bug de tu negocio" (ventana) ·
// línea de comandos en la terminal para curiosos (ayuda, audio, bug, mail, secreto…).

const CELLS = 13;

const BARS = [
  { id: "cafe", label: "café", pct: 96, tone: "rose" },
  { id: "codigo", label: "código", pct: 58, tone: "aqua" },
  { id: "paciencia", label: "paciencia de la dev", pct: 22, tone: "gray" },
] as const;

// ── Textos (editables) ──
const BUBBLE_DEFAULT = [
  "> confidencial: este sitio lo construí mientras construía los de mis clientes.",
  "> Ya está en línea. Lo que sigue es tu sistema.",
];

const CHAT = [
  {
    key: "que",
    question: "¿qué estás construyendo?",
    answer:
      "> Sistemas para negocios que hoy dependen de que estés encima: turnos, cobros, mensajes, stock. Cada uno a medida del tuyo.",
  },
  {
    key: "empiezo",
    question: "¿por dónde empiezo?",
    answer:
      "> Mandale un audio a tu sistema roto: tocá el botón de abajo y contame qué te consume el tiempo. Lo escucho yo.",
  },
  {
    key: "secreto",
    question: "contame un secreto",
    answer:
      "> Este sitio lo construí con el mismo método que uso con mis clientes: primero entiendo cómo funciona, después construyo.",
  },
] as const;

const AUDIO_LABEL = "¿Tu sistema está roto? Mandale un audio";

// Línea de comandos de la terminal
const HELP = "> comandos: audio · bug · mail · proyectos · secreto · ayuda";
type CommandResult = { text: string; action?: "audio" | "bug" | "mail" };

function runCommand(raw: string): CommandResult {
  const cmd = raw.trim().toLowerCase().replace(/^[>$\s]+/, "");
  if (!cmd) return { text: HELP };
  if (["ayuda", "help", "?", "comandos"].includes(cmd)) return { text: HELP };
  if (["audio", "whatsapp", "wsp", "wpp", "contacto", "contactar"].includes(cmd))
    return { text: "> abriendo WhatsApp… mandale un audio a tu sistema roto 🎙️", action: "audio" };
  if (["bug", "error", "reportar", "roto"].includes(cmd))
    return { text: "> abriendo error.exe… contame qué se rompe.", action: "bug" };
  if (["mail", "email", "correo"].includes(cmd)) return { text: `> ${CONTACT_EMAIL}`, action: "mail" };
  if (["proyectos", "portfolio", "ls"].includes(cmd))
    return { text: "> los globitos que flotan alrededor son proyectos reales. Tocalos." };
  if (cmd === "secreto") return { text: CHAT[2].answer };
  if (cmd.startsWith("sudo")) return { text: "> permiso denegado. Acá la arquitecta soy yo." };
  if (["hola", "hi", "hello"].includes(cmd)) return { text: "> hola 👋 probá «audio» si querés contarme algo." };
  if (["cafe", "café"].includes(cmd)) return { text: "> café: 96%. Recargando… ☕" };
  if (["clear", "cls", "limpiar"].includes(cmd)) return { text: "" };
  return { text: `> «${raw.trim()}»: comando no encontrado. Probá «ayuda».` };
}

// Centro reservado para la terminal (598px en el mockup de 1366px), más aire a los lados.
const reservedCenter = (width: number) => Math.min(width * 0.4376, 598) + 48;

export default function SistemaSection() {
  const [filled, setFilled] = useState<Record<string, number>>({ cafe: 0, codigo: 0, paciencia: 0 });
  const [answer, setAnswer] = useState<string | null>(null);
  const [command, setCommand] = useState("");
  const [bugOpen, setBugOpen] = useState(false);
  const closeBug = useCallback(() => setBugOpen(false), []);

  // Barras que se llenan de a una celda
  useEffect(() => {
    const timers: number[] = [];
    BARS.forEach((bar, index) => {
      const target = Math.round((bar.pct / 100) * CELLS);
      timers.push(
        window.setTimeout(() => {
          let count = 0;
          const interval = window.setInterval(() => {
            count += 1;
            setFilled((current) => ({ ...current, [bar.id]: count }));
            if (count >= target) window.clearInterval(interval);
          }, 65);
          timers.push(interval);
        }, 300 + index * 400),
      );
    });
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  function handleCommand(event: FormEvent) {
    event.preventDefault();
    const result = runCommand(command);
    setAnswer(result.text || null);
    setCommand("");
    if (result.action === "audio") window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer");
    if (result.action === "bug") setBugOpen(true);
    if (result.action === "mail") window.location.href = `mailto:${CONTACT_EMAIL}`;
  }

  return (
    <section className={`${styles.section} ${shared.gridBlue}`} {...sectionProps("sistema")}>
      <SectionTag section="sistema" />
      <FloatingProjects reservedCenter={reservedCenter} />

      <div className={styles.column}>
        <h2 className={styles.title}>
          No es magia
          <br />
          es arquitectura digital
        </h2>

        <div className={styles.terminal}>
          <div className={styles.terminalBar}>
            <span className={styles.dots} aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <p>Proyectos</p>
          </div>

          <div className={styles.terminalBody}>
            <p className={styles.prompt}>&gt; Estado del proyecto</p>

            <div className={styles.bars}>
              {BARS.map((bar) => (
                <div key={bar.id} className={styles.barRow}>
                  <span className={styles.barLabel}>[◼︎] {bar.label}:</span>
                  <span className={styles.cells} aria-hidden="true">
                    {Array.from({ length: CELLS }, (_, i) => (
                      <i key={i} data-on={i < filled[bar.id] ? bar.tone : undefined} />
                    ))}
                  </span>
                  <span className={styles.pct}>{Math.round((filled[bar.id] / CELLS) * 100)}%</span>
                </div>
              ))}
            </div>

            <div className={styles.bubble} aria-live="polite">
              {answer ? (
                <p key={answer}>{answer}</p>
              ) : (
                BUBBLE_DEFAULT.map((line) => <p key={line}>{line}</p>)
              )}
            </div>

            <form className={styles.cmd} onSubmit={handleCommand}>
              <label htmlFor="sistema-cmd" className={styles.cmdPrompt}>
                &gt;
              </label>
              <input
                id="sistema-cmd"
                className={styles.cmdInput}
                value={command}
                onChange={(event) => setCommand(event.target.value)}
                placeholder="escribí «ayuda»"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                aria-label="Línea de comandos: escribí ayuda para ver los comandos"
              />
            </form>
          </div>

          <DemoFaceWink className={styles.wink} />
        </div>

        <div className={styles.lower}>
          <img className={styles.mail} src="/assets/recursos-graficos/mail-celeste.svg" alt="" width={225} height={225} />

          <div className={styles.chips}>
            {CHAT.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`${styles.chip} ${answer === item.answer ? styles.chipActive : ""}`}
                onClick={() => setAnswer(item.answer)}
              >
                {item.question}
              </button>
            ))}
          </div>

          <div className={styles.form}>
            <p className={styles.formLabel}>{AUDIO_LABEL}</p>
            <a className={styles.audioBtn} href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <span aria-hidden="true">🎙️</span> Mandar audio
            </a>
            <button type="button" className={styles.bugLink} onClick={() => setBugOpen(true)}>
              ¿Sin WhatsApp? Reportá un bug de tu negocio <span aria-hidden="true">⚠</span>
            </button>
          </div>
        </div>

        <ProjectsCarousel />
      </div>

      <BugReport open={bugOpen} onClose={closeBug} />
    </section>
  );
}
