export const SECTIONS = {
  hero: {
    code: "HERO",
    label: "01 · Hero",
    title: "Ventanas animadas",
    slide: 1,
    id: "hero",
  },
  ticker: {
    code: "TICKER",
    label: "01b · Ticker",
    title: "Banda naranja",
    slide: 1,
    id: "ticker",
  },
  demo: {
    code: "DEMO",
    label: "02 · Demo",
    title: "Te lo demuestro",
    slide: 2,
    id: "demo",
  },
  arquitectura: {
    code: "ARQUITECTURA",
    label: "03 · Arquitectura",
    title: "De manual a automático",
    slide: 3,
    id: "arquitectura",
  },
  caos: {
    code: "CAOS",
    label: "04 · Caos",
    title: "Escapá del caos",
    slide: "4–5",
    id: "caos",
  },
  contacto: {
    code: "CONTACTO",
    label: "06 · Contacto",
    title: "Próximo paso",
    slide: 6,
    id: "contacto",
  },
  sistema: {
    code: "SISTEMA",
    label: "07 · Sistema",
    title: "Arquitectura digital",
    slide: 7,
    id: "sistema",
  },
  portfolio: {
    code: "PORTFOLIO",
    label: "08 · Portfolio",
    title: "Proyectos + diagrama",
    slide: 8,
    id: "portfolio",
  },
} as const;

export type SectionKey = keyof typeof SECTIONS;

export function sectionProps(key: SectionKey) {
  const section = SECTIONS[key];
  return {
    id: section.id,
    "data-section": section.code,
    "aria-label": `${section.code} — ${section.title}`,
  };
}
