import { crearMesFacturacion } from "./facturacion-model.js";

const STOCKIN_MESES = [
  {
    mes: "2026-07",
    etapa: "Licencia de uso — Mes 1",
    documentoDetalle: {
      numero: "DS-2026-007",
      templateKey: "stockin-lavanda-2026-07",
    },
    importe: {
      moneda: "USD",
      total: "1500",
    },
    notas: "Detalle de valorización — primera mensualidad (USD 1.500 neto).",
  },
  {
    mes: "2026-08",
    etapa: "Licencia de uso — Mes 2",
    documentoDetalle: {
      numero: "DS-2026-008",
      templateKey: "stockin-lavanda-2026-08",
    },
    importe: {
      moneda: "USD",
      total: "1500",
    },
    notas: "Detalle de valorización — segunda mensualidad (USD 1.500 neto). Incluye resumen del período (USD 3.000).",
  },
];

export function esClienteStockin(cliente) {
  const slug = String(cliente?.slug || "").toLowerCase();
  const negocio = String(cliente?.negocio || "").toLowerCase();
  return slug === "stockin-lavanda" || negocio.includes("stockin");
}

function mergeMes(base, seed) {
  const next = structuredClone(base);
  if (seed.etapa && !next.etapa) next.etapa = seed.etapa;
  if (seed.notas && !next.notas) next.notas = seed.notas;
  if (seed.documentoDetalle) {
    next.documentoDetalle = { ...next.documentoDetalle, ...seed.documentoDetalle };
    if (!next.documentoDetalle.numero && seed.documentoDetalle.numero) {
      next.documentoDetalle.numero = seed.documentoDetalle.numero;
    }
    if (!next.documentoDetalle.templateKey && seed.documentoDetalle.templateKey) {
      next.documentoDetalle.templateKey = seed.documentoDetalle.templateKey;
    }
  }
  if (seed.importe) {
    next.importe = { ...next.importe, ...seed.importe };
    if (!next.importe.total && seed.importe.total) next.importe.total = seed.importe.total;
  }
  return next;
}

/** Agrega julio y agosto 2026 si faltan (Stockin Lavanda). */
export function asegurarFacturacionStockin(cliente, facturacion = []) {
  if (!esClienteStockin(cliente)) return facturacion;
  const byMes = new Map(facturacion.map((m) => [m.mes, m]));
  const out = [...facturacion];
  for (const seed of STOCKIN_MESES) {
    const existente = byMes.get(seed.mes);
    if (existente) {
      const idx = out.findIndex((m) => m.mes === seed.mes);
      if (idx >= 0) out[idx] = mergeMes(out[idx], seed);
    } else {
      out.push(mergeMes(crearMesFacturacion(seed.mes), seed));
    }
  }
  return out;
}
