import crypto from "crypto";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import path from "path";
import { authFromRequest, passwordRequired, verifyToken } from "./auth.js";
import { normalizeSupabaseUrl } from "./supabase-erp.js";

// Calendario de contenido compartido por link.
// - Cada persona tiene su link (token). Con él ve el calendario y comenta; no crea, edita ni borra piezas.
// - Ailén (sesión del ERP) ve todo, crea/desactiva links, comenta como "Ailén" y marca comentarios como resueltos.
// - Las piezas y miniaturas viven en server/calendario (data.json + img/): solo salen por estas rutas, con token o sesión.
// - Links y comentarios: tablas calendario_accesos / calendario_comentarios en el Supabase del ERP (supabase/calendario.sql).

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "calendario");
const MAX_COMENTARIO = 1000;
const ADMIN_AUTOR = "Ailén";

// ── utilidades ──────────────────────────────────────────
function send(res, status, body, headers = {}) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(body));
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (c) => { body += c; });
    req.on("end", () => {
      try { resolve(JSON.parse(body || "{}")); } catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}

function isAdmin(req, env) {
  if (!passwordRequired(env)) return true; // ERP sin contraseña (solo local)
  return Boolean(verifyToken(authFromRequest(req), env));
}

function viewerToken(req) {
  const t = String(req.headers?.["x-cal-token"] || "").trim();
  return /^[A-Za-z0-9_-]{16,64}$/.test(t) ? t : "";
}

function db(env) {
  const url = normalizeSupabaseUrl(env.SUPABASE_URL);
  const key = String(env.SUPABASE_SERVICE_ROLE_KEY || "").trim().replace(/^["']|["']$/g, "");
  if (!url || !key) {
    const err = new Error("Falta configurar Supabase (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
    err.status = 503;
    throw err;
  }
  return async (pathAndQuery, { method = "GET", body, prefer } = {}) => {
    const res = await fetch(`${url}/rest/v1/${pathAndQuery}`, {
      method,
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...(prefer ? { Prefer: prefer } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text();
      const err = new Error(
        /calendario_/.test(text) && /does not exist|not find/i.test(text)
          ? "Faltan las tablas del calendario: corré erp/supabase/calendario.sql en Supabase."
          : `Supabase ${res.status}: ${text.slice(0, 200)}`,
      );
      err.status = 502;
      throw err;
    }
    return res.status === 204 ? null : res.json();
  };
}

let calendarioCache = null;
async function loadCalendario() {
  if (!calendarioCache) calendarioCache = JSON.parse(await readFile(path.join(DIR, "data.json"), "utf8"));
  return calendarioCache;
}

/** Quién pide: { admin: true } | { token, nombre } | null */
async function whoIs(req, env, q) {
  if (isAdmin(req, env) && !viewerToken(req)) return { admin: true };
  const token = viewerToken(req);
  if (!token) return null;
  const rows = await q(`calendario_accesos?token=eq.${encodeURIComponent(token)}&activo=eq.true&select=token,nombre`);
  if (!rows?.length) return null;
  return rows[0];
}

const hits = new Map();
function rateLimited(key, limit = 30, windowMs = 60 * 60 * 1000) {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > limit;
}

function handleError(res, error) {
  console.error("[calendario]", error.message);
  send(res, error.status || 500, { error: error.status ? error.message : "Error del servidor." });
}

// ── GET /api/calendario/data ─────────────────────────────
// Devuelve las piezas + los comentarios visibles para quien pide.
export async function handleCalendarioData(req, res, env = process.env) {
  if (req.method !== "GET") return send(res, 405, { error: "Método no permitido." });
  try {
    const q = db(env);
    const who = await whoIs(req, env, q);
    if (!who) return send(res, 401, { error: "Este link no es válido o fue desactivado." });

    const calendario = await loadCalendario();
    const filtro = who.admin
      ? "calendario_comentarios?select=id,pieza_id,autor,texto,resuelto,created_at,token&order=created_at.asc"
      : `calendario_comentarios?select=id,pieza_id,autor,texto,resuelto,created_at&or=(token.eq.${encodeURIComponent(who.token)},token.is.null)&order=created_at.asc`;
    const comentarios = await q(filtro);

    if (!who.admin) {
      q(`calendario_accesos?token=eq.${encodeURIComponent(who.token)}`, {
        method: "PATCH",
        body: { ultimo_acceso: new Date().toISOString() },
      }).catch(() => {});
    }
    send(res, 200, { calendario, comentarios, viewer: who.admin ? { admin: true, nombre: ADMIN_AUTOR } : { nombre: who.nombre } });
  } catch (error) {
    handleError(res, error);
  }
}

// ── GET /api/calendario/img?f=img/archivo.png ────────────
export async function handleCalendarioImg(req, res, env = process.env) {
  if (req.method !== "GET") return send(res, 405, { error: "Método no permitido." });
  try {
    const url = new URL(req.url, "http://x");
    const f = url.searchParams.get("f") || "";
    if (!/^img\/[A-Za-z0-9._-]+\.(png|jpe?g|webp)$/i.test(f)) return send(res, 400, { error: "Imagen inválida." });
    const q = db(env);
    const who = await whoIs(req, env, q);
    if (!who) return send(res, 401, { error: "Link inválido." });
    const calendario = await loadCalendario();
    if (!calendario.piezas.some((p) => (p.imagenes || []).includes(f))) return send(res, 404, { error: "No existe." });
    const bytes = await readFile(path.join(DIR, f));
    res.statusCode = 200;
    res.setHeader("Content-Type", f.endsWith(".png") ? "image/png" : f.endsWith(".webp") ? "image/webp" : "image/jpeg");
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.end(bytes);
  } catch (error) {
    handleError(res, error);
  }
}

// ── /api/calendario/comentarios ──────────────────────────
// POST {piezaId, texto}: comenta quien tiene link (o Ailén). GET: todos (solo Ailén). PATCH {id, resuelto}: solo Ailén.
export async function handleCalendarioComentarios(req, res, env = process.env) {
  try {
    const q = db(env);
    if (req.method === "GET") {
      if (!isAdmin(req, env)) return send(res, 401, { error: "Sesión inválida o expirada." });
      const rows = await q(
        "calendario_comentarios?select=id,pieza_id,autor,texto,resuelto,created_at,token&order=created_at.desc&limit=300",
      );
      return send(res, 200, { comentarios: rows });
    }
    if (req.method === "PATCH") {
      if (!isAdmin(req, env)) return send(res, 401, { error: "Sesión inválida o expirada." });
      const body = await readJsonBody(req);
      const id = Number(body.id);
      if (!Number.isInteger(id)) return send(res, 400, { error: "Comentario inválido." });
      await q(`calendario_comentarios?id=eq.${id}`, { method: "PATCH", body: { resuelto: Boolean(body.resuelto) } });
      return send(res, 200, { ok: true });
    }
    if (req.method === "POST") {
      const who = await whoIs(req, env, q);
      if (!who) return send(res, 401, { error: "Este link no es válido o fue desactivado." });
      const body = await readJsonBody(req);
      const piezaId = String(body.piezaId || "").trim();
      const texto = String(body.texto || "").replace(/<[^>]*>/g, "").trim().slice(0, MAX_COMENTARIO);
      if (!texto) return send(res, 400, { error: "Escribí un comentario." });
      const calendario = await loadCalendario();
      if (!calendario.piezas.some((p) => p.id === piezaId)) return send(res, 400, { error: "Pieza inválida." });
      if (!who.admin && rateLimited(who.token)) return send(res, 429, { error: "Demasiados comentarios seguidos. Probá en un rato." });
      const [row] = await q("calendario_comentarios", {
        method: "POST",
        prefer: "return=representation",
        body: { pieza_id: piezaId, token: who.admin ? null : who.token, autor: who.admin ? ADMIN_AUTOR : who.nombre, texto },
      });
      return send(res, 201, { comentario: { id: row.id, pieza_id: row.pieza_id, autor: row.autor, texto: row.texto, resuelto: row.resuelto, created_at: row.created_at } });
    }
    send(res, 405, { error: "Método no permitido." });
  } catch (error) {
    handleError(res, error);
  }
}

// ── /api/calendario/accesos (solo Ailén) ─────────────────
// GET: lista · POST {nombre}: crea un link · PATCH {token, activo}: desactiva / reactiva.
export async function handleCalendarioAccesos(req, res, env = process.env) {
  if (!isAdmin(req, env)) return send(res, 401, { error: "Sesión inválida o expirada." });
  try {
    const q = db(env);
    if (req.method === "GET") {
      const [accesos, comentarios] = await Promise.all([
        q("calendario_accesos?select=token,nombre,activo,created_at,ultimo_acceso&order=created_at.desc"),
        q("calendario_comentarios?select=token,resuelto"),
      ]);
      const conteo = {};
      for (const c of comentarios) {
        if (!c.token) continue;
        conteo[c.token] ??= { total: 0, pendientes: 0 };
        conteo[c.token].total++;
        if (!c.resuelto) conteo[c.token].pendientes++;
      }
      return send(res, 200, { accesos: accesos.map((a) => ({ ...a, comentarios: conteo[a.token] || { total: 0, pendientes: 0 } })) });
    }
    if (req.method === "POST") {
      const body = await readJsonBody(req);
      const nombre = String(body.nombre || "").replace(/<[^>]*>/g, "").trim().slice(0, 80);
      if (!nombre) return send(res, 400, { error: "Poné el nombre de la persona." });
      const token = crypto.randomBytes(18).toString("base64url");
      const [row] = await q("calendario_accesos", { method: "POST", prefer: "return=representation", body: { token, nombre } });
      return send(res, 201, { acceso: { ...row, comentarios: { total: 0, pendientes: 0 } } });
    }
    if (req.method === "PATCH") {
      const body = await readJsonBody(req);
      const token = String(body.token || "");
      if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return send(res, 400, { error: "Link inválido." });
      await q(`calendario_accesos?token=eq.${encodeURIComponent(token)}`, { method: "PATCH", body: { activo: Boolean(body.activo) } });
      return send(res, 200, { ok: true });
    }
    send(res, 405, { error: "Método no permitido." });
  } catch (error) {
    handleError(res, error);
  }
}
