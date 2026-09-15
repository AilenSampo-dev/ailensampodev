import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = join(__dirname, "templates", "facturacion");

/** Claves de plantilla → archivo HTML embebido para envío por mail. */
export const FACTURACION_TEMPLATES = {
  "stockin-lavanda-2026-07": {
    archivo: "stockin-lavanda-2026-07.html",
    titulo: "Licencia de uso — Mes 1",
    mes: "2026-07",
    previewPath: "/facturacion/stockin-lavanda/2026-07/detalle-servicios.html",
  },
  "stockin-lavanda-2026-08": {
    archivo: "stockin-lavanda-2026-08.html",
    titulo: "Licencia de uso — Mes 2",
    mes: "2026-08",
    previewPath: "/facturacion/stockin-lavanda/2026-08/detalle-servicios.html",
  },
};

const cache = new Map();

export function getFacturacionTemplateHtml(templateKey) {
  const meta = FACTURACION_TEMPLATES[templateKey];
  if (!meta) {
    const err = new Error(`Plantilla de facturación desconocida: ${templateKey}`);
    err.status = 404;
    throw err;
  }
  if (cache.has(templateKey)) return cache.get(templateKey);
  const html = readFileSync(join(TEMPLATE_DIR, meta.archivo), "utf8");
  cache.set(templateKey, html);
  return html;
}

export function urlPreviewFacturacion(templateKey) {
  return FACTURACION_TEMPLATES[templateKey]?.previewPath || null;
}
