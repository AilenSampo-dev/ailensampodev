/** Colores s(a) — inline para clientes de mail (sin CSS variables). */
export const SA = {
  plum: "#3A1E66",
  pink: "#F656BF",
  mint: "#ABE3D2",
  grey: "#4D4F54",
  ink: "#1a1030",
  paper: "#ffffff",
  paper2: "#faf7fe",
  font: "Arial, Helvetica, sans-serif",
  mono: "'Courier New', Courier, monospace",
};

export function wrapEmailShell(innerHtml, { preheader = "" } = {}) {
  const pre = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>`
    : "";
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:${SA.plum};font-family:${SA.font};color:${SA.ink};">
${pre}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${SA.plum};">
<tr><td align="center" style="padding:28px 16px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:${SA.paper};">
    <tr><td style="padding:40px 36px;font-family:${SA.font};font-size:15px;line-height:1.55;color:${SA.ink};">
${innerHtml}
    </td></tr>
  </table>
  <p style="margin:16px 0 0;font-family:${SA.mono};font-size:11px;color:#d4c4e8;text-align:center;">s (a) · Ailen Sampó · Sistemas a medida</p>
</td></tr>
</table>
</body>
</html>`;
}

/** Botón CTA compatible con Outlook/Gmail (tabla, no &lt;button&gt;). */
export function emailCta(href, label) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
<tr><td align="center" bgcolor="${SA.pink}" style="border-radius:999px;background-color:${SA.pink};">
  <a href="${href}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:${SA.font};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;">${label}</a>
</td></tr>
</table>`;
}

export function transactionalEmailHtml({ saludo, intro, ctaHref, ctaLabel, nota, linkFallback }) {
  const inner = `
<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${SA.ink};">${saludo}</p>
<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${SA.grey};">${intro}</p>
${emailCta(ctaHref, ctaLabel)}
<p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:${SA.grey};">${nota}</p>
<p style="margin:0;font-size:12px;line-height:1.5;color:${SA.grey};word-break:break-all;">${linkFallback}<br><a href="${ctaHref}" style="color:${SA.pink};">${ctaHref}</a></p>`;
  return wrapEmailShell(inner);
}
