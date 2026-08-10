/** Plantillas HTML para emails Brevo — s(a) · Ailen Sampo */

const BRAND = {
  plum: "#3A1E66",
  pink: "#F656BF",
  mint: "#2FA98A",
  ink: "#1A0E33",
  muted: "#6B6280",
  faint: "#9A93A8",
  paper: "#FFFFFF",
  bg: "#F4F1F8",
  line: "#E8E4EF",
};

export function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Layout base compatible con clientes de email (tablas + estilos inline).
 */
export function buildEmailHtml({ preheader, title, introHtml, cta, noteHtml, footerExtra }) {
  const preheaderSafe = esc(preheader);
  const ctaBlock = cta?.url
    ? `<tr>
        <td style="padding:28px 32px 8px;text-align:center;">
          <a href="${esc(cta.url)}" target="_blank" rel="noopener"
            style="display:inline-block;background:${BRAND.pink};color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:999px;line-height:1.2;">
            ${esc(cta.label || "Abrir enlace")}
          </a>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 32px 0;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:${BRAND.faint};line-height:1.5;word-break:break-all;">
          ${esc(cta.url)}
        </td>
      </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="color-scheme" content="light"/>
  <title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheaderSafe}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${BRAND.paper};border-radius:16px;overflow:hidden;border:1px solid ${BRAND.line};">
          <tr>
            <td style="background:${BRAND.plum};padding:28px 32px 24px;text-align:center;">
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#ffffff;letter-spacing:-0.02em;line-height:1;">
                s(a)
              </div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.72);margin-top:10px;">
                Ailen Sampo · Sistemas a medida
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 0;font-family:Arial,Helvetica,sans-serif;">
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:${BRAND.ink};line-height:1.25;letter-spacing:-0.02em;">
                ${esc(title)}
              </h1>
              <div style="font-size:15px;line-height:1.65;color:${BRAND.muted};">
                ${introHtml}
              </div>
            </td>
          </tr>
          ${ctaBlock}
          ${noteHtml ? `<tr><td style="padding:24px 32px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:${BRAND.faint};">${noteHtml}</td></tr>` : ""}
          <tr>
            <td style="padding:32px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${BRAND.faint};border-top:1px solid ${BRAND.line};margin-top:8px;">
              ${footerExtra || ""}
              <div style="margin-top:12px;">
                <a href="https://www.ailensampo.com" style="color:${BRAND.pink};text-decoration:none;font-weight:600;">ailensampo.com</a>
              </div>
            </td>
          </tr>
        </table>
        <div style="max-width:560px;margin:16px auto 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:${BRAND.faint};text-align:center;line-height:1.5;">
          Este mensaje es personal e intransferible. Si no lo esperabas, podés ignorarlo.
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildFirmaContratoEmail({ representante, cliente, proyecto, url }) {
  const saludo = representante ? esc(representante) : "Hola";
  const docLabel = [proyecto, cliente].filter(Boolean).map(esc).join(" · ") || "tu contrato";

  const introHtml = `
    <p style="margin:0 0 14px;color:${BRAND.ink};">Hola <strong>${saludo}</strong>,</p>
    <p style="margin:0 0 14px;">Te enviamos el contrato de <strong style="color:${BRAND.plum};">${docLabel}</strong> para revisar y aceptar en línea.</p>
    <p style="margin:0;">Leé el documento completo y firmá con tu <strong>nombre completo</strong> como representante legal de la empresa.</p>
  `;

  const noteHtml = `
    <p style="margin:0;padding:14px 16px;background:#F0FBF7;border-radius:10px;border-left:3px solid ${BRAND.mint};color:${BRAND.muted};">
      Al aceptar recibirás por email el <strong>certificado con huella digital SHA-256</strong> del documento firmado.
    </p>
  `;

  return buildEmailHtml({
    preheader: `Contrato listo para firmar — ${proyecto || cliente || "documento"}`,
    title: "Contrato para aceptar",
    introHtml,
    cta: { url, label: "Revisar y firmar contrato" },
    noteHtml,
    footerExtra: `<strong style="color:${BRAND.ink};">s(a)</strong> · Ailen Sampo · Sistemas a medida`,
  });
}

export function buildCertificadoEmail({ typedName, cliente, proyecto }) {
  const saludo = typedName ? esc(typedName) : "Hola";
  const docLabel = [proyecto, cliente].filter(Boolean).map(esc).join(" · ") || "el contrato";

  const introHtml = `
    <p style="margin:0 0 14px;color:${BRAND.ink};">Hola <strong>${saludo}</strong>,</p>
    <p style="margin:0 0 14px;">Adjuntamos el <strong>certificado de aceptación</strong> de ${docLabel}.</p>
    <p style="margin:0;">Incluye la huella digital SHA-256, fecha, hora e identificadores técnicos del documento que aceptaste.</p>
  `;

  const noteHtml = `
    <p style="margin:0;padding:14px 16px;background:#FDF0FA;border-radius:10px;border-left:3px solid ${BRAND.pink};color:${BRAND.muted};">
      El PDF va adjunto a este email. Guardalo para tus registros.
    </p>
  `;

  return buildEmailHtml({
    preheader: `Certificado de aceptación — ${proyecto || cliente || "contrato"}`,
    title: "Certificado de aceptación",
    introHtml,
    noteHtml,
    footerExtra: `<strong style="color:${BRAND.ink};">s(a)</strong> · Ailen Sampo · Sistemas a medida`,
  });
}
