import { getToken } from "./erp-api.js";

const PREVIEW_PATHS = {
  "stockin-lavanda-2026-07": "/facturacion/stockin-lavanda/2026-07/detalle-servicios.html",
  "stockin-lavanda-2026-08": "/facturacion/stockin-lavanda/2026-08/detalle-servicios.html",
};

export function urlPreviewFacturacion(templateKey) {
  return PREVIEW_PATHS[templateKey] || null;
}

/** Misma URL que el botón «Ver detalle» del ERP, en absoluta para el mail. */
export function urlFacturacionCompleta(templateKey) {
  const path = urlPreviewFacturacion(templateKey);
  if (!path) return null;
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${path}`;
  }
  return path;
}

export async function enviarDetalleFacturacionPorEmail({
  to,
  templateKey,
  documentUrl,
  cliente,
  representante,
  numeroDoc,
  mes,
}) {
  const token = getToken();
  const url = documentUrl || urlFacturacionCompleta(templateKey);
  const res = await fetch("/api/facturacion/enviar-detalle", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ to, templateKey, documentUrl: url, cliente, representante, numeroDoc, mes }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error || "No se pudo enviar el detalle por mail.");
  return j;
}
