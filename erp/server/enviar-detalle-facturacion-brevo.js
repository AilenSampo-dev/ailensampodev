import { FACTURACION_TEMPLATES, urlFacturacionPublica } from "./facturacion-templates.js";
import { attachAdminCopy, normalizeEmail, resolveAdminEmail } from "./brevo-admin-copy.js";
import { transactionalEmailHtml } from "./email-brand.js";

/**
 * Envío de detalle de facturación vía Brevo — mail con botón a la URL pública del documento.
 */
export async function enviarDetalleFacturacionBrevo(data, env = process.env) {
  const apiKey = env.BREVO_API_KEY;
  const fromEmail = normalizeEmail(env.BREVO_FROM_EMAIL || env.PROPOSAL_NOTIFY_EMAIL);
  const adminEmail = resolveAdminEmail(env);

  if (!apiKey || !fromEmail) {
    const err = new Error("Configurá BREVO_API_KEY y BREVO_FROM_EMAIL en las variables de entorno.");
    err.status = 503;
    throw err;
  }

  const to = normalizeEmail(data.to);
  const templateKey = String(data.templateKey || "").trim();
  const cliente = String(data.cliente || "Stockin Lavanda");
  const representante = String(data.representante || "").trim();
  const numeroDoc = String(data.numeroDoc || "").trim();
  const mes = String(data.mes || "").trim();

  if (!to.includes("@") || !templateKey) {
    const err = new Error("Email del cliente y plantilla son obligatorios.");
    err.status = 400;
    throw err;
  }

  const meta = FACTURACION_TEMPLATES[templateKey];
  // Preferir la URL que ya usa el ERP («Ver detalle»); fallback servidor (APP_URL).
  const url = String(data.documentUrl || "").trim() || urlFacturacionPublica(templateKey, env);
  if (!url) {
    const err = new Error(`URL pública no configurada para ${templateKey}.`);
    err.status = 404;
    throw err;
  }

  const titulo = meta?.titulo || "Detalle de facturación";
  const subject = numeroDoc
    ? `Detalle de facturación · ${numeroDoc} · ${titulo}`
    : `Detalle de facturación · ${titulo}`;

  const saludo = representante ? `Hola ${representante},` : "Hola,";
  const intro = `Te compartimos el detalle de facturación <strong>${titulo}</strong>${mes ? ` (${mes})` : ""} para <strong>${cliente}</strong>. Incluye la valorización del desarrollo aplicado y el neto facturado según lo acordado en contrato.`;

  const textContent = [
    saludo,
    "",
    `Detalle de facturación (${titulo})${mes ? ` — ${mes}` : ""} para ${cliente}.`,
    "",
    "Abrí el documento en el navegador:",
    url,
    "",
    "s(a) · Ailén Sampó · Sistemas a medida",
    "www.ailensampo.com",
  ].join("\n");

  const htmlContent = transactionalEmailHtml({
    saludo,
    intro,
    ctaHref: url,
    ctaLabel: "Ver detalle de facturación",
    nota: "El documento se abre en el navegador con el diseño completo. Podés imprimirlo o guardarlo como PDF desde ahí.",
    linkFallback: "Si el botón no funciona, copiá este enlace:",
  });

  const payload = {
    sender: { name: "Ailén Sampo · s(a)", email: fromEmail },
    to: [{ email: to, name: representante || cliente }],
    subject,
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
      msg =
        "Brevo bloqueó esta IP. Entrá a app.brevo.com → Security → Authorized IPs y agregá tu IP actual (o desactivá la restricción).";
    }
    const err = new Error(msg);
    err.status = 502;
    throw err;
  }

  return { ok: true, to, templateKey, url, copiaAdmin };
}
