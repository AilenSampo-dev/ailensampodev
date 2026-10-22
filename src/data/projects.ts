export type Project = {
  title: string;
  url: string;
  image: string;
  color: string;
  size: number;
  bg?: string;
  coverPos?: string;
  coverFit?: string;
};

export const PROJECTS: Project[] = [
  {
    title: "Sofia Ciabattoni",
    url: "https://www.sofiaciabattoni.com/",
    image: "/assets/portfolio/sofiaCiabattoni.png",
    color: "#E1ADFF",
    bg: "#ffffff",
    coverPos: "center 12%",
    size: 112,
  },
  {
    title: "SIGNA°",
    url: "https://signauniformes.com/",
    image: "/assets/portfolio/sigabanner.webp",
    color: "#F58220",
    bg: "#ffffff",
    coverPos: "center center",
    size: 112,
  },
  {
    title: "Catita's Donuts",
    url: "https://catitasdonuts.netlify.app/",
    image: "/assets/portfolio/catitasDonuts.png",
    color: "#F656BF",
    bg: "#ffffff",
    coverFit: "contain",
    coverPos: "center center",
    size: 84,
  },
  {
    title: "El Taller de Augusto",
    url: "https://lego-augusto.vercel.app/",
    image: "/assets/portfolio/burbuja_lego.svg",
    color: "#F656BF",
    size: 80,
  },
  {
    title: "Mesa de Tickets",
    url: "https://mesadetickets-18xa.vercel.app/",
    image: "/assets/portfolio/burbuja_mesadetickets.svg",
    color: "#5C64F2",
    size: 78,
  },
  {
    title: "PsicoGestión",
    url: "https://psicogestion-eta.vercel.app/",
    image: "/assets/portfolio/burbuja_psicogestion.svg",
    color: "#ABE3D2",
    size: 78,
  },
  {
    title: "Minecraft",
    url: "https://minecraft-t.vercel.app/",
    image: "/assets/portfolio/burbuja_minecraft.svg",
    color: "#6882EB",
    size: 82,
  },
  {
    title: "Portfolio Quest",
    url: "https://portfolioeli.netlify.app/arcade",
    image: "/assets/portfolio/burbuja_portfolio.svg",
    color: "#FAF26F",
    size: 80,
  },
  {
    title: "Contingencia Alicia",
    url: "https://contingenciaalicia.netlify.app/",
    image: "/assets/portfolio/burbuja_contingencia.svg",
    color: "#AEBFF2",
    size: 78,
  },
  {
    title: "Color Master",
    url: "https://cartacolormaster.netlify.app/",
    image: "/assets/portfolio/burbuja_colormaster.svg",
    color: "#F656BF",
    size: 78,
  },
];

export const MOBILE_PROJECT_ORDER = [
  "Sofia Ciabattoni",
  "SIGNA°",
  "Catita's Donuts",
  "Mesa de Tickets",
  "Contingencia Alicia",
  "PsicoGestión",
  "Color Master",
  "Portfolio Quest",
  "Minecraft",
  "El Taller de Augusto",
];

export function projectsForMobile(): Project[] {
  return MOBILE_PROJECT_ORDER.map((title) =>
    PROJECTS.find((p) => p.title === title)
  ).filter((p): p is Project => Boolean(p));
}
