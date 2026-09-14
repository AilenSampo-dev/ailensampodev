import { requireAuth } from "./auth.js";
import { enviarContratoAlCliente, obtenerContratoPublico, aceptarContratoPublico } from "./contrato-publico.js";

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (c) => { body += c; });
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

export async function handleContratoEnviar(req, res, env = process.env) {
  if (req.method !== "POST") {
    json(res, 405, { error: "Method not allowed" });
    return;
  }
  if (!requireAuth(req, res, env)) return;

  try {
    const body = await readJsonBody(req);
    const result = await enviarContratoAlCliente(body, env);
    json(res, 200, result);
  } catch (e) {
    json(res, e.status || 500, { error: e.message || "Error interno" });
  }
}

export async function handleContratoPublico(req, res, env = process.env) {
  try {
    if (req.method === "GET") {
      const url = new URL(req.url, "http://localhost");
      const token = url.searchParams.get("token");
      if (!token) {
        json(res, 400, { error: "Token requerido." });
        return;
      }
      const data = await obtenerContratoPublico(token, env);
      json(res, 200, data);
      return;
    }

    if (req.method === "POST") {
      const body = await readJsonBody(req);
      const result = await aceptarContratoPublico(body, req, env);
      json(res, 200, result);
      return;
    }

    json(res, 405, { error: "Method not allowed" });
  } catch (e) {
    json(res, e.status || 500, { error: e.message || "Error interno" });
  }
}
