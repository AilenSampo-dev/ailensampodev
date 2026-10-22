"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { DEMO_TASK_TAGS, type DemoTaskTag } from "./demoTasks";
import styles from "./ChaosSection.module.css";

// Ronda 1 de "Escapá del caos": las tareas caen, lo que no tocás se apila, se acelera. Diseñada para perder.

export const GAME_SECONDS = 30;
const ICONS = "/assets/recursos-graficos/";

export const TASK_KINDS: Record<DemoTaskTag, { label: string; icon?: string; glyph?: string; tone: string }> = {
  "Respuestas infinitas": { label: "WhatsApp", icon: "globo-chat.svg", tone: "blue" },
  "Clientes que se pierden": { label: "Consulta", icon: "mail.svg", tone: "rose" },
  "Plantillas que nadie ve": { label: "Presupuesto", glyph: "≡", tone: "aqua" },
  "Reuniones sin control": { label: "Reunión", glyph: "◷", tone: "yellow" },
  "Cobros que demoran": { label: "Cobro", glyph: "$", tone: "orange" },
};

const POPUPS = [
  "¿Me pasás el precio?",
  "¿Llegó mi pedido?",
  "¿Tenés turno mañana?",
  "Te mandé un audio",
  "¿Me reenviás la factura?",
  "¿Seguimos en pie?",
];

type Task = { id: number; tag: DemoTaskTag; x: number; y: number; vy: number };
type Popup = { id: number; x: number; y: number; text: string; born: number };
type Fx = { id: number; x: number; y: number; kind: "burst" | "combo" | "lost"; text?: string; born: number };

export type ManualStats = { resolved: number; lost: number; timeLeft: number };
export type ManualResult = ManualStats & {
  total: number;
  lostByTag: Partial<Record<DemoTaskTag, number>>;
  tapado: boolean;
  seconds: number;
};

type Props = {
  /** Tarea que la persona eligió arriba: cae más seguido. */
  weightTag: DemoTaskTag | null;
  onStats: (stats: ManualStats) => void;
  onEnd: (result: ManualResult) => void;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export default function ManualRound({ weightTag, onStats, onEnd }: Props) {
  const boardRef = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onStats, onEnd, weightTag });
  callbacks.current = { onStats, onEnd, weightTag };
  const [, setFrame] = useState(0);

  const game = useRef({
    tasks: [] as Task[],
    popups: [] as Popup[],
    fx: [] as Fx[],
    pile: [] as DemoTaskTag[],
    resolved: 0,
    lost: 0,
    total: 0,
    lostByTag: {} as Partial<Record<DemoTaskTag, number>>,
    combo: 0,
    lastHit: 0,
    nextSpawn: 0.3,
    nextPopup: 4.5,
    id: 0,
    start: 0,
    last: 0,
    now: 0,
    shakeUntil: 0,
    winkUntil: 0,
    statsKey: "",
    ended: false,
    tile: 72,
    mini: 26,
    pileH: 0,
  });

  // ── acciones ──
  function pickTag(): DemoTaskTag {
    const weighted = callbacks.current.weightTag;
    if (weighted && Math.random() < 0.45) return weighted;
    return DEMO_TASK_TAGS[Math.floor(Math.random() * DEMO_TASK_TAGS.length)];
  }

  function spawnTask(tag: DemoTaskTag, W: number, H: number, progress: number, y = -game.current.tile) {
    const g = game.current;
    const scale = Math.max(0.7, H / 568);
    g.tasks.push({
      id: ++g.id,
      tag,
      x: Math.random() * Math.max(1, W - g.tile),
      y,
      vy: lerp(85, 215, progress) * scale * (0.85 + Math.random() * 0.3),
    });
    g.total++;
  }

  function lose(tag: DemoTaskTag, x: number, y: number) {
    const g = game.current;
    g.lost++;
    g.lostByTag[tag] = (g.lostByTag[tag] ?? 0) + 1;
    g.pile.push(tag);
    g.combo = 0;
    g.fx.push({ id: ++g.id, x, y, kind: "lost", text: "−1", born: g.now });
    g.shakeUntil = g.now + 280;
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(25);
  }

  function hit(x: number, y: number) {
    const g = game.current;
    g.resolved++;
    g.combo = g.now - g.lastHit < 900 ? g.combo + 1 : 1;
    g.lastHit = g.now;
    g.fx.push({ id: ++g.id, x, y, kind: "burst", born: g.now });
    if (g.combo >= 3) {
      g.fx.push({ id: ++g.id, x, y: y - 10, kind: "combo", text: `x${g.combo}!`, born: g.now });
      g.winkUntil = g.now + 900;
    }
  }

  function hitTask(id: number) {
    const g = game.current;
    const task = g.tasks.find((t) => t.id === id);
    if (!task || g.ended) return;
    g.tasks = g.tasks.filter((t) => t.id !== id);
    hit(task.x + g.tile / 2, task.y + g.tile / 2);
  }

  function closePopup(id: number) {
    const g = game.current;
    const popup = g.popups.find((p) => p.id === id);
    if (!popup || g.ended) return;
    g.popups = g.popups.filter((p) => p.id !== id);
    hit(popup.x + 90, popup.y + 30);
  }

  // ── loop ──
  useEffect(() => {
    const g = game.current;
    let raf = 0;
    g.start = performance.now();
    g.last = g.start;

    const loop = (now: number) => {
      const board = boardRef.current;
      if (!board || g.ended) return;
      const W = board.clientWidth;
      const H = board.clientHeight;
      const dt = Math.min(0.05, (now - g.last) / 1000);
      g.last = now;
      g.now = now;
      const t = (now - g.start) / 1000;
      const progress = Math.min(1, t / GAME_SECONDS);

      g.tile = W < 640 ? 56 : 72;
      g.mini = W < 640 ? 18 : 24;
      const cols = Math.max(1, Math.floor(W / (g.mini + 4)));
      g.pileH = Math.ceil(g.pile.length / cols) * (g.mini + 4);

      // aparecen tareas (cada vez más seguido)
      if (t >= g.nextSpawn) {
        spawnTask(pickTag(), W, H, progress);
        g.nextSpawn = t + lerp(0.95, 0.32, progress) * (0.75 + Math.random() * 0.5);
      }
      // pop-ups "urgentes" que tapan el tablero
      if (t >= g.nextPopup) {
        const w = Math.min(220, W - 24);
        g.popups.push({
          id: ++g.id,
          x: 12 + Math.random() * Math.max(1, W - w - 24),
          y: 12 + Math.random() * Math.max(1, H * 0.45),
          text: POPUPS[Math.floor(Math.random() * POPUPS.length)],
          born: now,
        });
        g.total++;
        g.nextPopup = t + 5 + Math.random() * 2.5;
      }

      // caen; lo que toca la pila se pierde (y los WhatsApp ignorados se multiplican)
      const floor = H - g.pileH - g.tile;
      const alive: Task[] = [];
      for (const task of g.tasks) {
        task.y += task.vy * dt;
        if (task.y >= floor) {
          lose(task.tag, task.x + g.tile / 2, floor + g.tile / 2);
          if (task.tag === "Respuestas infinitas" && Math.random() < 0.45) {
            spawnTask(task.tag, W, H, progress);
            spawnTask(task.tag, W, H, progress, -g.tile * 2);
          }
        } else {
          alive.push(task);
        }
      }
      g.tasks = alive;

      g.popups = g.popups.filter((popup) => {
        if (now - popup.born < 4500) return true;
        lose("Respuestas infinitas", popup.x + 90, popup.y + 30);
        return false;
      });
      g.fx = g.fx.filter((fx) => now - fx.born < 700);

      const timeLeft = Math.max(0, Math.ceil(GAME_SECONDS - t));
      const key = `${g.resolved}/${g.lost}/${timeLeft}`;
      if (key !== g.statsKey) {
        g.statsKey = key;
        callbacks.current.onStats({ resolved: g.resolved, lost: g.lost, timeLeft });
      }

      const tapado = g.pileH > H * 0.55;
      if (t >= GAME_SECONDS || tapado) {
        g.ended = true;
        callbacks.current.onEnd({
          resolved: g.resolved,
          lost: g.lost + g.tasks.length + g.popups.length, // lo que quedó en pantalla también se perdió
          timeLeft,
          total: g.total,
          lostByTag: g.lostByTag,
          tapado,
          seconds: Math.round(Math.min(t, GAME_SECONDS)),
        });
        return;
      }

      setFrame((f) => (f + 1) % 1_000_000);
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const g = game.current;
  const shaking = g.now < g.shakeUntil;
  const winking = g.now < g.winkUntil;
  const boardStyle = { "--tile": `${g.tile}px`, "--mini": `${g.mini}px` } as CSSProperties;

  return (
    <div ref={boardRef} className={`${styles.board} ${shaking ? styles.shake : ""}`} style={boardStyle}>
      {g.tasks.map((task) => {
        const kind = TASK_KINDS[task.tag];
        return (
          <button
            key={task.id}
            type="button"
            className={styles.task}
            data-tone={kind.tone}
            style={{ transform: `translate3d(${task.x}px, ${task.y}px, 0)` }}
            onPointerDown={(event) => {
              event.preventDefault();
              hitTask(task.id);
            }}
            aria-label={`Resolver ${kind.label}`}
          >
            {kind.icon ? (
              <img src={`${ICONS}${kind.icon}`} alt="" className={styles.taskIcon} draggable={false} />
            ) : (
              <span className={styles.taskGlyph}>{kind.glyph}</span>
            )}
            <span className={styles.taskLabel}>{kind.label}</span>
          </button>
        );
      })}

      {g.popups.map((popup) => (
        <div key={popup.id} className={styles.popup} style={{ left: popup.x, top: popup.y }} role="alert">
          <div className={styles.popupBar}>
            <span />
            <span />
            <span />
            <button
              type="button"
              className={styles.popupClose}
              onPointerDown={(event) => {
                event.preventDefault();
                closePopup(popup.id);
              }}
              aria-label="Cerrar mensaje"
            >
              ×
            </button>
          </div>
          <p>
            <strong>URGENTE:</strong> {popup.text}
          </p>
        </div>
      ))}

      <div className={styles.pile} aria-hidden="true">
        {g.pile.map((tag, i) => (
          <span key={i} className={styles.pileTile} data-tone={TASK_KINDS[tag].tone} />
        ))}
      </div>

      {g.fx.map((fx) =>
        fx.kind === "burst" ? (
          <span key={fx.id} className={styles.burst} style={{ left: fx.x, top: fx.y }} aria-hidden="true">
            {Array.from({ length: 8 }, (_, i) => (
              <i key={i} style={{ "--a": `${i * 45}deg` } as CSSProperties} />
            ))}
          </span>
        ) : (
          <span
            key={fx.id}
            className={fx.kind === "combo" ? styles.combo : styles.lostFx}
            style={{ left: fx.x, top: fx.y }}
            aria-hidden="true"
          >
            {fx.text}
          </span>
        ),
      )}

      <img
        className={styles.runner}
        src={`${ICONS}dino-recorte.svg`}
        alt=""
        style={{ bottom: g.pileH }}
        draggable={false}
      />
      {winking ? <img className={styles.reaction} src={`${ICONS}face-wink.svg`} alt="" /> : null}
    </div>
  );
}
