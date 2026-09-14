import { generarAddendumElixioHtml } from "./contrato-template.js";

const uid = () => Math.random().toString(36).slice(2, 9);

export const ADDENDUM_ELIXIO = {
  slug: "elixio-coins",
  titulo: "Addendum — Programa Elixio Coins",
};

export function obtenerAddendumElixio(proyecto, cliente) {
  const existente = (proyecto.addendums || []).find((a) => a.slug === ADDENDUM_ELIXIO.slug);
  if (existente) return existente;

  return {
    id: uid(),
    slug: ADDENDUM_ELIXIO.slug,
    titulo: ADDENDUM_ELIXIO.titulo,
    html: generarAddendumElixioHtml({ cliente, proyecto }),
    estado: "borrador",
    contratoOriginalFecha: "10 de agosto de 2026",
    firmaToken: null,
    enviadoAt: null,
    enviadoA: null,
    aceptacion: null,
  };
}

export function mergeAddendumEnProyecto(proyecto, addendum) {
  const prev = proyecto.addendums || [];
  const idx = prev.findIndex((a) => a.id === addendum.id || a.slug === addendum.slug);
  const next = idx >= 0 ? prev.map((a, i) => (i === idx ? addendum : a)) : [...prev, addendum];
  return { ...proyecto, addendums: next };
}

export function estadoAddendumLabel(estado) {
  if (estado === "aceptado") return "Confirmado";
  if (estado === "enviado") return "Enviado";
  return "Borrador";
}
