export const gradients = {
  /** Slide 1 + 6 — púrpura oscuro → rosa */
  hero: { from: "#361f62", to: "#e462bb", artboard: 28 },
  /** Slides 2+3 — /test compartido — rosa → verde agua */
  test: { from: "#e462bb", to: "#b7e2d3", artboard: 25 },
  /** Builder fondo — lila → púrpura */
  builderDark: { from: "#d9affa", to: "#361f62", artboard: 31 },
  /** Builder glow — naranja → púrpura */
  builderGlow: { from: "#ed6e46", to: "#361f62", artboard: 32 },
  /** Ticker footer slide 1 — amarillo → naranja */
  ticker: { from: "#f9f283", to: "#ed6e46", artboard: 27 },
  /** Acento verde → amarillo */
  accent: { from: "#b7e2d3", to: "#f9f283", artboard: 24 },
  /** Transición verde → púrpura */
  transition: { from: "#b7e2d3", to: "#361f62", artboard: 29 },
  /** Slide 7 — azul plano, sin degradé */
  sistema: { flat: "#6882EB" },
} as const;
