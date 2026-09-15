import { requireAuth } from "./auth.js";
import { enviarDetalleFacturacionBrevo } from "./enviar-detalle-facturacion-brevo.js";

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (c) => {
      body += c;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

export async function handleFacturacionEnviarDetalle(req, res, env = process.env) {
  if (req.method !== "POST") {
    json(res, 405, { error: "Method not allowed" });
    return;
  }
  if (!requireAuth(req, res, env)) return;

  try {
    const body = await readJsonBody(req);
    const result = await enviarDetalleFacturacionBrevo(body, env);
    json(res, 200, result);
  } catch (e) {
    json(res, e.status || 500, { error: e.message || "Error interno" });
  }
}
