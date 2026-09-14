/**
 * Email al cliente con enlace único para firmar el contrato.
 */
export async function enviarEnlaceFirmaBrevo(data, env = process.env) {
  const apiKey = env.BREVO_API_KEY;
  const fromEmail = env.BREVO_FROM_EMAIL || env.PROPOSAL_NOTIFY_EMAIL;
  const adminEmail = env.ADMIN_EMAIL || env.PROPOSAL_NOTIFY_EMAIL || fromEmail;

  if (!apiKey || !fromEmail) {
    const err = new Error("Configurá BREVO_API_KEY y BREVO_FROM_EMAIL.");
    err.status = 503;
    throw err;
  }

  const to = String(data.to || "").trim();
  const url = String(data.url || "");
  const cliente = String(data.cliente || "");
  const proyecto = String(data.proyecto || "");
  const representante = String(data.representante || "");

  if (!to.includes("@") || !url) {
    const err = new Error("Email y enlace son obligatorios.");
    err.status = 400;
    throw err;
  }

  const textContent = [
    `Hola${representante ? ` ${representante}` : ""},`,
    "",
    `Te enviamos el contrato${proyecto ? ` — ${proyecto}` : ""}${cliente ? ` (${cliente})` : ""} para revisar y aceptar.`,
    "",
    "Abrí este enlace único, leé el documento y firmá con tu nombre completo como representante legal:",
    "",
    url,
    "",
    "Al aceptar recibirás por email el certificado con la huella digital del documento.",
    "",
    "s(a) · Ailen Sampo · Sistemas a medida",
    "www.ailensampo.com",
  ].join("\n");

  const payload = {
    sender: { name: "Ailen Sampo · s(a)", email: fromEmail },
    to: [{ email: to, name: representante || cliente }],
    subject: `Contrato para aceptar · ${proyecto || "Documento"}`,
    textContent,
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
      msg = "Brevo bloqueo esta IP. Autorizala en app.brevo.com → Security → Authorized IPs.";
    }
    const err = new Error(msg);
    err.status = 502;
    throw err;
  }

  return { ok: true, to };
}
