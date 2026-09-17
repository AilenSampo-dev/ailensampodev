export function normalizeEmail(raw) {
  return String(raw || "").trim().replace(/^["']|["']$/g, "");
}

export function resolveAdminEmail(env = process.env) {
  const from = normalizeEmail(env.BREVO_FROM_EMAIL || env.PROPOSAL_NOTIFY_EMAIL);
  return normalizeEmail(env.ADMIN_EMAIL || env.PROPOSAL_NOTIFY_EMAIL || from);
}

/** Casillas que reciben copia: ADMIN_EMAIL + BREVO_FROM_EMAIL (hola@), sin duplicar ni copiar al cliente. */
export function adminCopyRecipients(to, env = process.env) {
  const dest = normalizeEmail(to).toLowerCase();
  const from = normalizeEmail(env.BREVO_FROM_EMAIL || env.PROPOSAL_NOTIFY_EMAIL);
  const admin = normalizeEmail(env.ADMIN_EMAIL || env.PROPOSAL_NOTIFY_EMAIL);

  const seen = new Set();
  const out = [];
  for (const raw of [admin, from]) {
    const email = normalizeEmail(raw);
    if (!email.includes("@")) continue;
    const key = email.toLowerCase();
    if (key === dest || seen.has(key)) continue;
    seen.add(key);
    out.push(email);
  }
  return out;
}

/** @deprecated Usar adminCopyRecipients */
export function adminCopyRecipient(to, adminEmail) {
  const dest = normalizeEmail(to).toLowerCase();
  const admin = normalizeEmail(adminEmail);
  if (!admin.includes("@")) return null;
  if (admin.toLowerCase() === dest) return null;
  return admin;
}

/** @deprecated Usar sendWithAdminCopy (mail separado, más fiable que CC). */
export function attachAdminCopy(payload, to, adminEmail) {
  const admin = adminCopyRecipient(to, adminEmail);
  if (!admin) return null;
  payload.cc = [{ email: admin, name: "Ailen Sampo · copia" }];
  return admin;
}
