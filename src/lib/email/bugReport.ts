import { WHATSAPP_URL } from "@/lib/contacto";

// Mails del "Reportá un bug de tu negocio": aviso a Ailén + confirmación a quien reportó.

const esc = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const wrap = (inner: string) => `<!doctype html><html lang="es"><body style="margin:0;padding:24px;background:#f3eefc;font-family:Arial,Helvetica,sans-serif;color:#3a1e66">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:2px solid #3a1e66">
<tr><td style="background:#1e0c39;padding:10px 14px;color:#ffffff;font-family:'Courier New',monospace;font-size:13px">
<span style="color:#f656bf">●</span> <span style="color:#faf26f">●</span> <span style="color:#abe3d2">●</span>&nbsp;&nbsp;error.exe
</td></tr>
<tr><td style="padding:24px 24px 28px;font-size:15px;line-height:1.5">${inner}</td></tr>
<tr><td style="padding:12px 24px;background:#e1adff;font-size:12px">Ailén Sampó · Sistemas a medida · <a href="https://ailensampo.com" style="color:#3a1e66">ailensampo.com</a></td></tr>
</table></body></html>`;

const quote = (mensaje: string) =>
  `<div style="margin:16px 0;padding:14px 16px;background:#fffbdb;border-left:4px solid #faf26f;white-space:pre-wrap">${esc(mensaje)}</div>`;

export function adminBugEmail(email: string, mensaje: string) {
  return {
    subject: "⚠ Nuevo bug reportado desde el sitio",
    html: wrap(`<p style="margin:0 0 8px;font-weight:bold">Alguien reportó un bug de su negocio.</p>
<p style="margin:0">De: <a href="mailto:${esc(email)}" style="color:#3a1e66">${esc(email)}</a></p>
${quote(mensaje)}
<p style="margin:0;font-size:13px;opacity:.8">Respondé este mail y le llega directo. También quedó en Neon (tabla leads) para el ERP.</p>`),
  };
}

export function clientBugEmail(mensaje: string) {
  return {
    subject: "Recibí tu reporte",
    html: wrap(`<p style="margin:0 0 12px;font-weight:bold">&gt; reporte recibido ✓</p>
<p style="margin:0">Hola. Recibí lo que me contaste:</p>
${quote(mensaje)}
<p style="margin:0 0 20px">Lo leo y te escribo para ver cómo se arregla. Si querés adelantar, mandame un audio contándome cómo lo resolvés hoy.</p>
<a href="${WHATSAPP_URL}" style="display:inline-block;padding:12px 20px;background:#ff6437;color:#ffffff;text-decoration:none;font-weight:bold;border-radius:6px">Mandar audio por WhatsApp</a>
<p style="margin:20px 0 0;font-size:12px;opacity:.75">Uso tus datos solo para responderte. Si querés que los borre, respondé este mail y listo.</p>`),
  };
}
