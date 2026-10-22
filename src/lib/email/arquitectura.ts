import { whatsappUrl } from "@/lib/contacto";

// Mails del PDF "Tu arquitectura": a la clienta (con el PDF) y copia a Ailén.

const esc = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

type Modulo = { label: string; title: string; desc: string };

const wrap = (inner: string) => `<!doctype html><html lang="es"><body style="margin:0;padding:24px;background:#f3eefc;font-family:Arial,Helvetica,sans-serif;color:#3a1e66">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:2px solid #3a1e66">
<tr><td style="background:#1e0c39;padding:10px 14px;color:#ffffff;font-family:'Courier New',monospace;font-size:13px">
<span style="color:#f656bf">●</span> <span style="color:#faf26f">●</span> <span style="color:#abe3d2">●</span>&nbsp;&nbsp;arquitectura.pdf
</td></tr>
<tr><td style="padding:24px 24px 28px;font-size:15px;line-height:1.5">${inner}</td></tr>
<tr><td style="padding:12px 24px;background:#e1adff;font-size:12px">Ailén Sampó · Sistemas a medida · <a href="https://ailensampo.com" style="color:#3a1e66">ailensampo.com</a></td></tr>
</table></body></html>`;

const lista = (modulos: Modulo[]) =>
  modulos
    .map(
      (m) =>
        `<div style="margin:0 0 8px;padding:10px 14px;background:#e1adff"><strong>${esc(m.title)}</strong><br><span style="font-size:13px">${esc(m.desc)}</span></div>`,
    )
    .join("");

export function clientPdfEmail(tarea: string, modulos: Modulo[]) {
  const audio = whatsappUrl(`Hola Ailén, recibí mi arquitectura para "${tarea}". Te mando un audio contándote cómo lo resuelvo hoy.`);
  return {
    subject: "Tu arquitectura",
    html: wrap(`<p style="margin:0 0 12px;font-weight:bold">Acá está tu arquitectura.</p>
<p style="margin:0 0 14px">Para "<em>${esc(tarea)}</em>", estos son los módulos que lo resuelven:</p>
${lista(modulos)}
<p style="margin:16px 0 20px">Te la dejo en PDF adjunto. Es un punto de partida: el sistema real lo diseño después de entender cómo funciona tu negocio por dentro.</p>
<a href="${audio}" style="display:inline-block;padding:12px 20px;background:#ff6437;color:#ffffff;text-decoration:none;font-weight:bold;border-radius:6px">Mandarme un audio por WhatsApp</a>
<p style="margin:20px 0 0;font-size:12px;opacity:.75">Uso tu mail solo para mandarte esto y responderte. Si querés que lo borre, respondé este mail y listo.</p>`),
  };
}

export function adminPdfEmail(email: string, tarea: string, modulos: Modulo[], fuente: string) {
  return {
    subject: `📄 Pidieron su arquitectura: ${tarea.slice(0, 60)}`,
    html: wrap(`<p style="margin:0 0 8px;font-weight:bold">Alguien pidió el PDF de su arquitectura.</p>
<p style="margin:0">De: <a href="mailto:${esc(email)}" style="color:#3a1e66">${esc(email)}</a></p>
<p style="margin:12px 0">Tarea: "<em>${esc(tarea)}</em>" · generada por ${fuente === "ia" ? "IA" : "reglas"}</p>
${lista(modulos)}
<p style="margin:14px 0 0;font-size:13px;opacity:.8">El PDF que recibió va adjunto. Respondé este mail y le llega directo. También quedó en Neon (leads).</p>`),
  };
}
