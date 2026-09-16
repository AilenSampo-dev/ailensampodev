export function normalizeEmail(raw) {
  return String(raw || "").trim().replace(/^["']|["']$/g, "");
}

export function resolveAdminEmail(env = process.env) {
  const from = normalizeEmail(env.BREVO_FROM_EMAIL || env.PROPOSAL_NOTIFY_EMAIL);
  return normalizeEmail(env.ADMIN_EMAIL || env.PROPOSAL_NOTIFY_EMAIL || from);
}

/**
 * Copia al admin vía CC (más visible y fiable que BCC en Gmail/Brevo).
 * No duplica si el destinatario principal ya es el admin.
 */
export function attachAdminCopy(payload, to, adminEmail) {
  const dest = normalizeEmail(to).toLowerCase();
  const admin = normalizeEmail(adminEmail);
  if (!admin.includes("@")) return null;
  if (admin.toLowerCase() === dest) return null;
  payload.cc = [{ email: admin, name: "Ailen Sampo · copia" }];
  return admin;
}
