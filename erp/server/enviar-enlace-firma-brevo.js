import { normalizeEmail, resolveAdminEmail } from "./brevo-admin-copy.js";
import { sendWithAdminCopy } from "./brevo-send.js";
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

  const adminIntro = `Copia ERP — contrato${proyecto ? ` <strong>${proyecto}</strong>` : ""} enviado a <strong>${to}</strong>${cliente ? ` (${cliente})` : ""}.`;

  return sendWithAdminCopy({
    apiKey,
    fromEmail,
    payload,
    to,
    adminEmail,
    adminCopy: {
      subject: `[Copia ERP] Contrato enviado · ${proyecto || "Documento"}`,
      textContent: [
        "Copia ERP — enlace de firma enviado al cliente.",
        "",
        `Proyecto: ${proyecto || "—"}`,
        `Cliente: ${cliente || "—"}`,
        `Enviado a: ${to}`,
        "",
        url,
        "",
        "s(a) · Ailen Sampo · Sistemas a medida",
      ].join("\n"),
      htmlContent: transactionalEmailHtml({
        saludo: "Hola,",
        intro: adminIntro,
        ctaHref: url,
        ctaLabel: "Abrir enlace de firma",
        nota: "Este mail es tu copia de respaldo. Revisá spam si no aparece en unos minutos.",
        linkFallback: "Enlace enviado al cliente:",
      }),
    },
  });
}
