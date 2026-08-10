import { verifyPassword, createToken, requireAuth, passwordRequired } from "./auth.js";
import { loadErpData, saveErpData, isCloudBackupEnabled } from "./supabase-erp.js";

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

export async function handleAuthLogin(req, res, env = process.env) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  try {
    const data = await readJsonBody(req);
    const check = verifyPassword(data.password, env);

    if (!check.ok) {
      res.statusCode = 401;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Contraseña incorrecta." }));
      return;
    }

    const token = createToken(env);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      token,
      cloudBackup: isCloudBackupEnabled(env),
      passwordRequired: passwordRequired(env),
    }));
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: e.message || "Error interno" }));
  }
}

export async function handleErpData(req, res, env = process.env) {
  if (!requireAuth(req, res, env)) return;

  try {
    if (req.method === "GET") {
      const cloud = await loadErpData(env);
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({
        cloudBackup: isCloudBackupEnabled(env),
        ...(cloud ?? { clientes: null, proyectos: null, dataVersion: 2, updatedAt: null }),
      }));
      return;
    }

    if (req.method === "PUT") {
      const data = await readJsonBody(req);
      if (!isCloudBackupEnabled(env)) {
        res.statusCode = 503;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Supabase no configurado. Agregá SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY." }));
        return;
      }

      const updatedAt = await saveErpData({
        clientes: data.clientes,
        proyectos: data.proyectos,
        dataVersion: data.dataVersion ?? 2,
      }, env);

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: true, updatedAt }));
      return;
    }

    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method not allowed" }));
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: e.message || "Error interno" }));
  }
}

export async function handleAuthStatus(req, res, env = process.env) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const token = requireAuth(req, res, env);
  if (!token) return;

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({
    ok: true,
    cloudBackup: isCloudBackupEnabled(env),
    passwordRequired: passwordRequired(env),
  }));
}
