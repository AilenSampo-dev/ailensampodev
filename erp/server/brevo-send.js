import { adminCopyRecipient, normalizeEmail } from "./brevo-admin-copy.js";

function parseBrevoError(errText) {
  let msg = `Brevo: ${errText.slice(0, 200)}`;
  if (errText.includes("unrecognised IP") || errText.includes("unrecognized IP")) {
    msg =
      "Brevo bloqueó esta IP. Autorizala en app.brevo.com → Security → Authorized IPs (o desactivá la restricción).";
  }
  return msg;
}

export async function postBrevoEmail(apiKey, payload) {
  const brevo = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!brevo.ok) {
    const errText = await brevo.text();
    const err = new Error(parseBrevoError(errText));
    err.status = 502;
    throw err;
  }

  let messageId = null;
  try {
    const body = await brevo.json();
    messageId = body?.messageId ?? null;
  } catch {
    /* respuesta vacía o no JSON */
  }

  return { messageId };
}

/**
 * Envía al cliente y, si ADMIN_EMAIL es distinto, un mail propio al admin
 * (más fiable que CC, que Gmail/Brevo a veces filtran o no entregan).
 */
export async function sendWithAdminCopy({
  apiKey,
  fromEmail,
  payload,
  to,
  adminEmail,
  adminCopy,
}) {
  const dest = normalizeEmail(to);
  await postBrevoEmail(apiKey, payload);

  const admin = adminCopyRecipient(dest, adminEmail);
  if (!admin || !adminCopy) {
    return { ok: true, to: dest, copiaAdmin: null };
  }

  await postBrevoEmail(apiKey, {
    sender: { name: "Ailen Sampo · s(a)", email: fromEmail },
    to: [{ email: admin, name: "Ailen Sampo · copia" }],
    subject: adminCopy.subject,
    textContent: adminCopy.textContent,
    htmlContent: adminCopy.htmlContent,
    attachment: adminCopy.attachment,
  });

  return { ok: true, to: dest, copiaAdmin: admin };
}
