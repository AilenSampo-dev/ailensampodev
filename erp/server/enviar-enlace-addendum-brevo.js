import { normalizeEmail, resolveAdminEmail } from "./brevo-admin-copy.js";
import { sendWithAdminCopy } from "./brevo-send.js";
import { transactionalEmailHtml } from "./email-brand.js";

/**
 * Email al cliente con botón para revisar y confirmar un addendum.
 */
export async function enviarEnlaceAddendumBrevo(data, env = process.env) {
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
  const titulo = String(data.titulo || "Addendum");
  const representante = String(data.representante || "");

  if (!to.includes("@") || !url) {
    const err = new Error("Email y enlace son obligatorios.");
    err.status = 400;
    throw err;
  }

  const saludo = `Hola${representante ? ` ${representante}` : ""},`;
  const intro = `Te enviamos el addendum <strong>${titulo}</strong>${cliente ? ` (${cliente})` : ""} para revisar y confirmar. Podés confirmar respondiendo a este mail o usando el botón de abajo.`;

  const textContent = [
    saludo,
    "",
    `Addendum "${titulo}"${cliente ? ` (${cliente})` : ""} para revisar y confirmar.`,
    "",
    "Abrí el documento y confirmá con tu nombre completo:",
    url,
    "",
    "También podés responder a este mail con tu conformidad.",
    "",
    "s(a) · Ailen Sampo · Sistemas a medida",
    "www.ailensampo.com",
  ].join("\n");

  const htmlContent = transactionalEmailHtml({
    saludo,
    intro,
    ctaHref: url,
    ctaLabel: "Ver y confirmar addendum",
    nota: "Este addendum complementa el contrato ya firmado. Si preferís, respondé a este mail con tu conformidad.",
    linkFallback: "Si el botón no funciona, copiá este enlace:",
  });

  const payload = {
    sender: { name: "Ailén Sampo · s(a)", email: fromEmail },
    to: [{ email: to, name: representante || cliente }],
    subject: `Addendum para confirmar · ${titulo}`,
    textContent,
    htmlContent,
  };

  const adminIntro = `Copia ERP — addendum <strong>${titulo}</strong> enviado a <strong>${to}</strong>${cliente ? ` (${cliente})` : ""}.`;

  return sendWithAdminCopy({
    apiKey,
    fromEmail,
    payload,
    to,
    adminEmail,
    env,
    adminCopy: {
      subject: `[Copia ERP] Addendum enviado · ${titulo}`,
      textContent: [
        "Copia ERP — addendum enviado al cliente.",
        "",
        `Addendum: ${titulo}`,
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
        ctaLabel: "Abrir enlace del addendum",
        nota: "Este mail es tu copia de respaldo. Si no lo ves en la bandeja, revisá spam o la carpeta Promociones.",
        linkFallback: "Enlace enviado al cliente:",
      }),
    },
  });
}
