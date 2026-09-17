import { normalizeEmail, resolveAdminEmail } from "./brevo-admin-copy.js";
import { sendWithAdminCopy } from "./brevo-send.js";

/**
 * Envío de certificado PDF vía Brevo (compartido dev + producción).
 */
export async function enviarCertificadoBrevo(data, env = process.env) {
  const apiKey = env.BREVO_API_KEY;
  const fromEmail = normalizeEmail(env.BREVO_FROM_EMAIL || env.PROPOSAL_NOTIFY_EMAIL);
  const adminEmail = resolveAdminEmail(env);

  if (!apiKey || !fromEmail) {
    const err = new Error("Configurá BREVO_API_KEY y BREVO_FROM_EMAIL en las variables de entorno.");
    err.status = 503;
    throw err;
  }

  const to = normalizeEmail(data.to);
  const pdfBase64 = String(data.pdfBase64 || "");
  const filename = String(data.filename || "certificado-aceptacion.pdf");
  const cliente = String(data.cliente || "");
  const proyecto = String(data.proyecto || "");
  const typedName = String(data.typedName || "");

  if (!to.includes("@") || !pdfBase64) {
    const err = new Error("Email del cliente y PDF son obligatorios.");
    err.status = 400;
    throw err;
  }

  const textContent = [
    `Hola${typedName ? ` ${typedName}` : ""},`,
    "",
    `Adjuntamos el certificado de aceptacion del contrato${proyecto ? ` — ${proyecto}` : ""}${cliente ? ` (${cliente})` : ""}.`,
    "",
    "Incluye la huella digital SHA-256 del documento aceptado, fecha, hora e identificadores tecnicos.",
    "",
    "s(a) · Ailen Sampo · Sistemas a medida",
    "www.ailensampo.com",
  ].join("\n");

  const payload = {
    sender: { name: "Ailen Sampo · s(a)", email: fromEmail },
    to: [{ email: to, name: typedName || cliente }],
    subject: `Certificado de aceptacion · ${proyecto || "Contrato"}`,
    textContent,
    attachment: [{ name: filename, content: pdfBase64 }],
  };

  const attachment = [{ name: filename, content: pdfBase64 }];

  return sendWithAdminCopy({
    apiKey,
    fromEmail,
    payload,
    to,
    adminEmail,
    env,
    adminCopy: {
      subject: `[Copia ERP] Certificado enviado · ${proyecto || "Contrato"}`,
      textContent: [
        "Copia ERP — certificado de aceptación enviado al cliente.",
        "",
        `Proyecto: ${proyecto || "—"}`,
        `Cliente: ${cliente || "—"}`,
        `Enviado a: ${to}`,
        `Firmante: ${typedName || "—"}`,
        "",
        "El PDF va adjunto en este mail.",
        "",
        "s(a) · Ailen Sampo · Sistemas a medida",
      ].join("\n"),
      attachment,
    },
  });
}
