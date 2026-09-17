export function normalizeEmail(raw) {
  return String(raw || "").trim().replace(/^["']|["']$/g, "");
}

export function resolveAdminEmail(env = process.env) {
  const from = normalizeEmail(env.BREVO_FROM_EMAIL || env.PROPOSAL_NOTIFY_EMAIL);
  return normalizeEmail(env.ADMIN_EMAIL || env.PROPOSAL_NOTIFY_EMAIL || from);
}

/** Casilla de copia: ADMIN_EMAIL o, si falta, BREVO_FROM_EMAIL (hola@). */
export function adminCopyRecipients(to, env = process.env) {
  const dest = normalizeEmail(to).toLowerCase();
  const from = normalizeEmail(env.BREVO_FROM_EMAIL || env.PROPOSAL_NOTIFY_EMAIL);
  const admin = normalizeEmail(env.ADMIN_EMAIL || from);

  const email = admin.includes("@") ? admin : from;
  if (!email.includes("@") || email.toLowerCase() === dest) return [];
  return [email];
}

/**
 * Remitente para copias internas. Si la copia va a hola@, no usar hola@ como From
 * (Zoho rebota el bucle). Usar BREVO_INTERNAL_SENDER (ej. @brevosend.com de Brevo).
 */
export function resolveAdminCopyMail(fromEmail, recipients, env = process.env) {
  const from = normalizeEmail(fromEmail);
  const inbox = recipients.map((r) => normalizeEmail(r).toLowerCase());
  const loopRisk = inbox.includes(from.toLowerCase());

  const internal = normalizeEmail(env.BREVO_INTERNAL_SENDER);
  const senderEmail =
    loopRisk && internal.includes("@") && internal.toLowerCase() !== from.toLowerCase()
      ? internal
      : from;

  const mail = {
    sender: { name: "Ailen Sampo · copia ERP", email: senderEmail },
  };

  if (senderEmail.toLowerCase() !== from.toLowerCase()) {
    mail.replyTo = { email: from, name: "Ailen Sampo · s(a)" };
  }

  return mail;
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
