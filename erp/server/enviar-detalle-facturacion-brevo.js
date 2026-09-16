import { FACTURACION_TEMPLATES, getFacturacionTemplateHtml } from "./facturacion-templates.js";
import { attachAdminCopy, normalizeEmail, resolveAdminEmail } from "./brevo-admin-copy.js";

/**
 * Envío de detalle de facturación HTML vía Brevo (dev + producción).
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
  const htmlContent = getFacturacionTemplateHtml(templateKey);
  const titulo = meta?.titulo || "Detalle de facturación";
  const subject = numeroDoc
    ? `Detalle de facturación · ${numeroDoc} · ${titulo}`
    : `Detalle de facturación · ${titulo}`;

  const saludo = representante ? `Hola ${representante},` : "Hola,";
  const textContent = [
    saludo,
    "",
    `Adjuntamos el detalle de facturación (${titulo})${mes ? ` — ${mes}` : ""} para ${cliente}.`,
    "",
    "El documento incluye la valorización del desarrollo aplicado y el neto facturado según lo acordado en contrato.",
    "",
    "s(a) · Ailén Sampó · Sistemas a medida",
    "www.ailensampo.com",
  ].join("\n");

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

  return { ok: true, to, templateKey, copiaAdmin };
}
