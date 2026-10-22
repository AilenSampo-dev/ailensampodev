"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { PROJECTS, projectsForMobile, type Project } from "@/data/projects";
import styles from "./ProjectBubbles.module.css";

// Proyectos — réplica de los "globitos" de la landing publicada (main:index.html), mismos valores:
// <FloatingProjects>: desktop, burbujas que flotan a los costados de un centro reservado (la terminal),
//   rebotan entre sí y se frenan con el mouse. Va dentro de un contenedor con position: relative.
// <ProjectsCarousel>: celu (≤600px), carrusel "proyectos · deslizá" con vaivén, desvanecido y flecha.

const MOBILE_MAX = 600;
const CAPTION_H = 36;
const GAP = 16;

type Bubble = {
  el: HTMLAnchorElement;
  size: number;
  totalH: number;
  side: "left" | "right";
  x: number;
  y: number;
  vx: number;
  vy: number;
  paused: boolean;
};

type Lanes = {
  pad: number;
  left: { minX: number; maxX: number };
  right: { minX: number; maxX: number };
};

function getLanes(w: number, bubbleSize: number, reservedCenter: number): Lanes {
  const pad = 48;
  const minLane = Math.max(80, bubbleSize + 8);
  let centerW = Math.min(reservedCenter, w);
  let centerLeft = (w - centerW) / 2;
  let centerRight = centerLeft + centerW;
  const gap = 12;
  let leftMax = centerLeft - gap;
  let rightMin = centerRight + gap;
  while ((leftMax - pad < minLane || w - pad - rightMin < minLane) && centerW > w * 0.28) {
    centerW = Math.max(w * 0.28, centerW - 40);
    centerLeft = (w - centerW) / 2;
    centerRight = centerLeft + centerW;
    leftMax = centerLeft - gap;
    rightMin = centerRight + gap;
  }
  return {
    pad,
    left: { minX: pad, maxX: Math.max(pad, leftMax) },
    right: { minX: rightMin, maxX: w - pad },
  };
}

function clamp(b: Bubble, lanes: Lanes, h: number) {
  const lane = lanes[b.side];
  const maxX = Math.max(lane.minX, lane.maxX - b.size);
  b.x = Math.min(Math.max(b.x, lane.minX), maxX);
  b.y = Math.min(Math.max(b.y, lanes.pad), h - lanes.pad - b.totalH);
}

function resolveCollisions(bubbles: Bubble[], gap: number) {
  for (let i = 0; i < bubbles.length; i++) {
    for (let j = i + 1; j < bubbles.length; j++) {
      const a = bubbles[i];
      const b = bubbles[j];
      if (a.side !== b.side) continue;
      let dx = b.x + b.size / 2 - (a.x + a.size / 2);
      let dy = b.y + b.size / 2 - (a.y + a.size / 2);
      let dist = Math.hypot(dx, dy);
      const minDist = (a.size + b.size) / 2 + gap;
      if (dist >= minDist) continue;
      if (dist < 0.001) {
        dx = Math.random() - 0.5 || 0.1;
        dy = Math.random() - 0.5 || 0.1;
        dist = Math.hypot(dx, dy);
      }
      const nx = dx / dist;
      const ny = dy / dist;
      const overlap = minDist - dist;
      const aMove = a.paused ? 0 : b.paused ? 1 : 0.5;
      const bMove = b.paused ? 0 : a.paused ? 1 : 0.5;
      if (!a.paused) {
        a.x -= nx * overlap * aMove;
        a.y -= ny * overlap * aMove;
      }
      if (!b.paused) {
        b.x += nx * overlap * bMove;
        b.y += ny * overlap * bMove;
      }
      if (!a.paused && !b.paused) {
        const dot = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
        if (dot > 0) {
          a.vx -= dot * nx * 0.5;
          a.vy -= dot * ny * 0.5;
          b.vx += dot * nx * 0.5;
          b.vy += dot * ny * 0.5;
        }
      }
    }
  }
}

function BubbleBody({ project, size }: { project: Project; size: number }) {
  const isSvg = project.image.endsWith(".svg");
  const imgStyle: CSSProperties = {
    objectPosition: project.coverPos ?? (isSvg ? "center 40%" : "center center"),
    ...(project.coverFit ? { objectFit: project.coverFit as CSSProperties["objectFit"] } : {}),
  };
  return (
    <span
      className={`${styles.body} ${isSvg ? styles.bodySvg : ""}`}
      style={{ width: size, height: size, background: project.bg, "--g-color": project.color } as CSSProperties}
    >
      <img className={styles.cover} src={project.image} alt="" style={imgStyle} loading="lazy" draggable={false} />
    </span>
  );
}

type FloatingProps = {
  /** Ancho (px) del centro que los globitos no invaden, según el ancho del contenedor. */
  reservedCenter: (width: number) => number;
};

export function FloatingProjects({ reservedCenter }: FloatingProps) {
  const floatRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const centerRef = useRef(reservedCenter);
  centerRef.current = reservedCenter;
  // ── Desktop: globitos flotantes ──
  useEffect(() => {
    const field = floatRef.current;
    if (!field) return;
    if (window.innerWidth <= MOBILE_MAX) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const maxSize = Math.max(...PROJECTS.map((p) => p.size || 78));
    const W = field.clientWidth;
    const H = field.clientHeight;
    const lanes0 = getLanes(W, maxSize, centerRef.current(W));
    const perSide = Math.ceil(PROJECTS.length / 2);
    const slotH = Math.max(100, (H - lanes0.pad * 2 - maxSize - CAPTION_H) / Math.max(1, perSide - 0.5));

    const bubbles: Bubble[] = PROJECTS.map((project, i) => {
      const el = linkRefs.current[i]!;
      const size = project.size || 78;
      const totalH = size + CAPTION_H;
      const side = i % 2 === 0 ? "left" : "right";
      const lane = lanes0[side];
      const laneW = Math.max(0, lane.maxX - lane.minX - size);
      const angle = (Math.random() - 0.5) * Math.PI * 0.35 + (side === "left" ? Math.PI : 0);
      const speed = 0.22 + Math.random() * 0.18;
      const slot = Math.floor(i / 2);
      return {
        el,
        size,
        totalH,
        side,
        x: lane.minX + (laneW > 0 ? Math.random() * laneW : 0),
        y: lanes0.pad + slot * slotH + Math.random() * Math.max(0, slotH - totalH - 8),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        paused: false,
      };
    });

    for (let n = 0; n < 16; n++) {
      resolveCollisions(bubbles, GAP);
      bubbles.forEach((b) => clamp(b, lanes0, H));
    }

    const cleanups: (() => void)[] = [];
    bubbles.forEach((b) => {
      const pause = () => (b.paused = true);
      const resume = () => (b.paused = false);
      b.el.addEventListener("mouseenter", pause);
      b.el.addEventListener("mouseleave", resume);
      b.el.addEventListener("focus", pause);
      b.el.addEventListener("blur", resume);
      b.el.style.transform = `translate(${b.x}px, ${b.y}px)`;
      cleanups.push(() => {
        b.el.removeEventListener("mouseenter", pause);
        b.el.removeEventListener("mouseleave", resume);
        b.el.removeEventListener("focus", pause);
        b.el.removeEventListener("blur", resume);
      });
    });

    let raf = 0;
    let visible = false;
    let shown = false;
    const timers: number[] = [];

    const frame = () => {
      const w = field.clientWidth;
      const h = field.clientHeight;
      const lanes = getLanes(w, maxSize, centerRef.current(w));
      bubbles.forEach((b) => {
        const lane = lanes[b.side];
        const maxX = Math.max(lane.minX, lane.maxX - b.size);
        if (!b.paused && !reduceMotion) {
          b.x += b.vx;
          b.y += b.vy;
          if (b.x <= lane.minX) { b.x = lane.minX; b.vx = Math.abs(b.vx); }
          if (b.x >= maxX) { b.x = maxX; b.vx = -Math.abs(b.vx); }
          if (b.y <= lanes.pad) { b.y = lanes.pad; b.vy = Math.abs(b.vy); }
          if (b.y + b.totalH >= h - lanes.pad) { b.y = h - lanes.pad - b.totalH; b.vy = -Math.abs(b.vy); }
        }
        clamp(b, lanes, h);
      });
      resolveCollisions(bubbles, GAP);
      bubbles.forEach((b) => {
        clamp(b, lanes, h);
        b.el.style.transform = `translate(${b.x}px, ${b.y}px)`;
      });
      if (visible) raf = requestAnimationFrame(frame);
    };

    // Solo se animan mientras la sección está en pantalla; aparecen de a una la primera vez.
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) {
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(frame);
          if (!shown) {
            shown = true;
            bubbles.forEach((b, i) => timers.push(window.setTimeout(() => b.el.classList.add(styles.show), i * 150)));
          }
        }
      },
      { threshold: 0.05 },
    );
    observer.observe(field);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
      timers.forEach((t) => window.clearTimeout(t));
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return (
      <div ref={floatRef} className={styles.field} aria-label="Proyectos">
      {PROJECTS.map((project, i) => {
        const size = project.size || 78;
        return (
          <a
            key={project.title}
            ref={(el) => {
              linkRefs.current[i] = el;
            }}
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={project.title}
            className={styles.globito}
            style={{ width: Math.max(size, 92), height: size + CAPTION_H, "--g-color": project.color } as CSSProperties}
          >
            <span className={styles.wrap}>
              <BubbleBody project={project} size={size} />
              <span className={styles.caption}>{project.title}</span>
            </span>
          </a>
        );
      })}
    </div>

  );
}

export function ProjectsCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollWrapRef = useRef<HTMLDivElement>(null);

  // ── Celu: carrusel con vaivén automático ──
  useEffect(() => {
    const track = trackRef.current;
    const scrollWrap = scrollWrapRef.current;
    if (!track || !scrollWrap) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let dir = 1;
    let paused = false;
    let pauseTimer = 0;
    let raf = 0;

    const hasOverflow = () => track.scrollWidth > track.clientWidth + 4;
    const updateHints = () => {
      if (!hasOverflow()) {
        scrollWrap.classList.remove(styles.canScroll, styles.atEnd);
        return;
      }
      scrollWrap.classList.add(styles.canScroll);
      scrollWrap.classList.toggle(styles.atEnd, track.scrollLeft >= track.scrollWidth - track.clientWidth - 8);
    };
    const pauseAuto = (ms: number) => {
      paused = true;
      window.clearTimeout(pauseTimer);
      pauseTimer = window.setTimeout(() => (paused = false), ms);
    };
    const onScroll = () => {
      updateHints();
      pauseAuto(5000);
    };
    const onTouch = () => pauseAuto(6000);

    track.addEventListener("scroll", onScroll, { passive: true });
    track.addEventListener("touchstart", onTouch, { passive: true });
    window.addEventListener("resize", updateHints);

    const tick = () => {
      if (!paused && !reduceMotion && hasOverflow() && track.offsetParent !== null) {
        track.scrollLeft += dir * 0.55;
        const max = track.scrollWidth - track.clientWidth;
        if (track.scrollLeft >= max - 2) dir = -1;
        if (track.scrollLeft <= 2) dir = 1;
        updateHints();
      }
      raf = requestAnimationFrame(tick);
    };
    updateHints();
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(pauseTimer);
      track.removeEventListener("scroll", onScroll);
      track.removeEventListener("touchstart", onTouch);
      window.removeEventListener("resize", updateHints);
    };
  }, []);

  function nextProjects() {
    trackRef.current?.scrollBy({ left: 104, behavior: "smooth" });
  }

  return (
      <div className={styles.mobile}>
      <p className={styles.mobileLabel}>proyectos · deslizá</p>
      <div ref={scrollWrapRef} className={styles.scroll}>
        <div ref={trackRef} className={styles.track}>
          {projectsForMobile().map((project) => (
            <a
              key={project.title}
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={project.title}
              className={styles.item}
            >
              <BubbleBody project={project} size={68} />
              <span className={styles.caption}>{project.title}</span>
            </a>
          ))}
        </div>
        <div className={styles.fade} aria-hidden="true" />
        <button type="button" className={styles.arrow} onClick={nextProjects} aria-label="Ver más proyectos">
          ›
        </button>
      </div>
    </div>
  );
}
