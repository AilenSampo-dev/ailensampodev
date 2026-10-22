import { getSql } from "@/lib/db";
import { adminInbox, internalSender, sendEmail } from "@/lib/email/brevo";

// Avisos a Ailén cuando algo del sitio deja de funcionar y no se arregla solo.
// Máximo un mail cada 24 h por tipo (registro en la tabla "alertas" de Neon).

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function alertarUnaVez(tipo: string, asunto: string, detalle: string, queHacer: string) {
  const sql = getSql();
  if (!sql) return;
  try {
    const recientes = (await sql`
      select 1 from alertas where tipo = ${tipo} and enviado_at > now() - interval '24 hours' limit 1`) as unknown[];
    if (recientes.length > 0) return;
    await sql`insert into alertas (tipo, detalle) values (${tipo}, ${detalle})`;
    await sendEmail({
      to: adminInbox(),
      fromEmail: internalSender(),
      fromName: "Sitio · alerta",
      subject: `⚠ ${asunto}`,
      html: `<div style="font-family:Arial,sans-serif;color:#3a1e66;font-size:15px;line-height:1.5;max-width:560px">
<p><strong>${esc(asunto)}</strong></p>
<p>${esc(detalle)}</p>
<p style="padding:12px 14px;background:#fffbdb;border-left:4px solid #faf26f"><strong>Qué hacer:</strong> ${esc(queHacer)}</p>
<p style="font-size:12px;opacity:.7">Mientras tanto el sitio sigue andando con el respaldo. No vas a recibir otro aviso de este tipo en 24 horas.</p>
</div>`,
    });
  } catch (error) {
    // Si falta la tabla "alertas" (no se corrió el SQL) o Neon falla, no rompemos nada.
    console.warn("[alertas] no se pudo registrar/enviar la alerta:", (error as Error).message);
  }
}
