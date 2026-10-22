export type ChatKey = "que" | "mucho" | "secreto";

export const CHAT: Record<ChatKey, string> = {
  mucho: "no podemos revelar detalles, pero involucra menos excel y más magia.",
  secreto:
    "confidencial: estoy construyendo este sitio mientras construyo los de mis clientes. la arquitecta también necesita su propio sistema.",
  que: "algo que hace que tu negocio funcione cuando vos no estás mirando. pronto.",
};

export const FACES: Record<ChatKey, string> = {
  que: "/assets/recursos-graficos/face-admiracion.svg",
  mucho: "/assets/recursos-graficos/face1.svg",
  secreto: "/assets/recursos-graficos/face-wink.svg",
};

export const MSG = {
  ok: "¡Listo! Te aviso apenas esté.",
  already: "¡Ya estabas anotada! Te aviso igual.",
} as const;

export const HEADLINE = "Este espacio pronto\nva a abrirse.";

export const BARS = [
  { id: "cafe", pct: 96 },
  { id: "codigo", pct: 58 },
  { id: "paciencia", pct: 22 },
] as const;

export const CELLS = 14;
