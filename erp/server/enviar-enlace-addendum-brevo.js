import { attachAdminCopy, normalizeEmail, resolveAdminEmail } from "./brevo-admin-copy.js";

/**
 * Email al cliente con enlace para revisar y confirmar un addendum.
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

  const textContent = [
    `Hola${representante ? ` ${representante}` : ""},`,
    "",
    `Te enviamos el addendum "${titulo}"${cliente ? ` (${cliente})` : ""} para revisar y confirmar.`,
    "",
    "Podés confirmar de dos formas:",
    "· Respondiendo a este mail con tu conformidad, o",
    "· Abriendo el enlace, leyendo el documento y confirmando con tu nombre completo:",
    "",
    url,
    "",
    "Este addendum complementa el contrato ya firmado; no requiere el proceso completo de firma electrónica del contrato madre.",
    "",
    "s(a) · Ailen Sampo · Sistemas a medida",
    "www.ailensampo.com",
  ].join("\n");

  const payload = {
    sender: { name: "Ailen Sampo · s(a)", email: fromEmail },
    to: [{ email: to, name: representante || cliente }],
    subject: `Addendum para confirmar · ${titulo}`,
    textContent,
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
