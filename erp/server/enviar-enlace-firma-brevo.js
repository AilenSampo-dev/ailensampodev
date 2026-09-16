import { attachAdminCopy, normalizeEmail, resolveAdminEmail } from "./brevo-admin-copy.js";
import { transactionalEmailHtml } from "./email-brand.js";

/**
 * Email al cliente con enlace único para firmar el contrato.
 */
export async function enviarEnlaceFirmaBrevo(data, env = process.env) {
  const apiKey = env.BREVO_API_KEY;
  const fromEmail = normalizeEmail(env.BREVO_FROM_EMAIL || env.PROPOSAL_NOTIFY_EMAIL);
  const adminEmail = resolveAdminEmail(env);

  if (!apiKey || !fromEmail) {
    const err = new Error("Configurá BREVO_API_KEY y BREVO_FROM_EMAIL.");
    err.status = 503;
    throw err;
  }

  const to = normalizeEmail(data.to);
  const url = String(data.url || "");
  const cliente = String(data.cliente || "");
  const proyecto = String(data.proyecto || "");
  const representante = String(data.representante || "");

  if (!to.includes("@") || !url) {
    const err = new Error("Email y enlace son obligatorios.");
    err.status = 400;
    throw err;
  }

  const saludo = `Hola${representante ? ` ${representante}` : ""},`;
  const intro = `Te enviamos el contrato${proyecto ? ` — <strong>${proyecto}</strong>` : ""}${cliente ? ` (${cliente})` : ""} para revisar y aceptar. Al confirmar recibirás el certificado con la huella digital del documento.`;

  const textContent = [
    saludo,
    "",
    `Contrato${proyecto ? ` — ${proyecto}` : ""}${cliente ? ` (${cliente})` : ""} para revisar y aceptar.`,
    "",
    url,
    "",
    "s(a) · Ailen Sampo · Sistemas a medida",
    "www.ailensampo.com",
  ].join("\n");

  const htmlContent = transactionalEmailHtml({
    saludo,
    intro,
    ctaHref: url,
    ctaLabel: "Ver y aceptar contrato",
    nota: "Enlace único e intransferible. Firmá con tu nombre completo como representante legal.",
    linkFallback: "Si el botón no funciona, copiá este enlace:",
  });

  const payload = {
    sender: { name: "Ailen Sampo · s(a)", email: fromEmail },
    to: [{ email: to, name: representante || cliente }],
    subject: `Contrato para aceptar · ${proyecto || "Documento"}`,
    textContent,
    htmlContent,
  };

  const copiaAdmin = attachAdminCopy(payload, to, adminEmail);

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
    let msg = `Brevo: ${errText.slice(0, 200)}`;
    if (errText.includes("unrecognised IP") || errText.includes("unrecognized IP")) {
      msg = "Brevo bloqueo esta IP. Autorizala en app.brevo.com → Security → Authorized IPs.";
    }
    const err = new Error(msg);
    err.status = 502;
    throw err;
  }

  return { ok: true, to, copiaAdmin };
}
