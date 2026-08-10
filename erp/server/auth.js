import crypto from "crypto";

const TOKEN_TTL_SEC = 60 * 60 * 24 * 7; // 7 días

function getSecret(env = process.env) {
  return env.JWT_SECRET || env.ERP_PASSWORD || "dev-insecure-secret";
}

export function verifyPassword(input, env = process.env) {
  const expected = env.ERP_PASSWORD;
  if (!expected) return { ok: true, reason: "no_password_configured" };
  if (!input) return { ok: false };
  const a = Buffer.from(String(input));
  const b = Buffer.from(String(expected));
  if (a.length !== b.length) return { ok: false };
  return { ok: crypto.timingSafeEqual(a, b) };
}

export function createToken(env = process.env) {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SEC;
  const payload = JSON.stringify({ sub: "erp", exp });
  const sig = crypto.createHmac("sha256", getSecret(env)).update(payload).digest("hex");
  return Buffer.from(JSON.stringify({ p: payload, s: sig })).toString("base64url");
}

export function verifyToken(token, env = process.env) {
  if (!token) return false;
  try {
    const { p: payload, s: sig } = JSON.parse(Buffer.from(token, "base64url").toString());
    const expected = crypto.createHmac("sha256", getSecret(env)).update(payload).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
    const { exp } = JSON.parse(payload);
    return exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function authFromRequest(req) {
  const h = req.headers?.authorization || req.headers?.Authorization || "";
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m?.[1] || "";
}

export function requireAuth(req, res, env = process.env) {
  const token = authFromRequest(req);
  if (!verifyToken(token, env)) {
    res.statusCode = 401;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Sesión inválida o expirada.", passwordRequired: true }));
    return null;
  }
  return token;
}

export function passwordRequired(env = process.env) {
  return !!env.ERP_PASSWORD;
}
