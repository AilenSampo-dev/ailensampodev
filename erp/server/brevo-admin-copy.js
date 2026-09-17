export function normalizeEmail(raw) {
  return String(raw || "").trim().replace(/^["']|["']$/g, "");
}

export function resolveAdminEmail(env = process.env) {
  const from = normalizeEmail(env.BREVO_FROM_EMAIL || env.PROPOSAL_NOTIFY_EMAIL);
  return normalizeEmail(env.ADMIN_EMAIL || env.PROPOSAL_NOTIFY_EMAIL || from);
}

/** Destinatario de copia admin, o null si no aplica (mismo mail que el cliente). */
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
