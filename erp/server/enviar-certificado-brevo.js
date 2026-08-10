import { buildCertificadoEmail } from "./email-template.js";

/**
 * Envío de certificado PDF vía Brevo (compartido dev + producción).
 */
export async function enviarCertificadoBrevo(data, env = process.env) {
  const apiKey = env.BREVO_API_KEY;
  const fromEmail = env.BREVO_FROM_EMAIL || env.PROPOSAL_NOTIFY_EMAIL;
  const adminEmail = env.ADMIN_EMAIL || env.PROPOSAL_NOTIFY_EMAIL || fromEmail;

  if (!apiKey || !fromEmail) {
    const err = new Error("Configurá BREVO_API_KEY y BREVO_FROM_EMAIL en las variables de entorno.");
    err.status = 503;
    throw err;
  }

  const to = String(data.to || "").trim();
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

  const htmlContent = buildCertificadoEmail({ typedName, cliente, proyecto });

  const payload = {
    sender: { name: "Ailen Sampo · s(a)", email: fromEmail },
    to: [{ email: to, name: typedName || cliente }],
    subject: `Certificado de aceptacion · ${proyecto || "Contrato"}`,
    textContent,
    htmlContent,
    attachment: [{ name: filename, content: pdfBase64 }],
  };

  if (adminEmail && adminEmail !== to) {
    payload.bcc = [{ email: adminEmail }];
  }

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
      msg =
        "Brevo bloqueo esta IP. Entra a app.brevo.com → Security → Authorized IPs y agrega tu IP actual (o desactiva la restriccion).";
    }
    const err = new Error(msg);
    err.status = 502;
    throw err;
  }

  return { ok: true, to, copiaAdmin: adminEmail && adminEmail !== to ? adminEmail : null };
}
