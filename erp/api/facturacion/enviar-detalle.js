import { enviarDetalleFacturacionBrevo } from "../../server/enviar-detalle-facturacion-brevo.js";
import { requireAuth } from "../../server/auth.js";

/** Vercel / serverless: POST /api/facturacion/enviar-detalle */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  if (!requireAuth(req, res, process.env)) return;

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const result = await enviarDetalleFacturacionBrevo(body);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(result));
  } catch (e) {
    res.statusCode = e.status || 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: e.message || "Error interno" }));
  }
}
