import { after, NextResponse } from "next/server";
import { adminBugEmail, clientBugEmail } from "@/lib/email/bugReport";
import { adminInbox, internalSender, sendEmail } from "@/lib/email/brevo";
import { getSql } from "@/lib/db";
import { getClientIp, hashIp } from "@/lib/ip";

// Guarda mails de contacto en Neon (tabla leads, que lee el ERP). Dos orígenes:
//  - con consultaId: pidió el PDF de su arquitectura; los datos salen de la consulta registrada.
//  - con origen (sin consulta): dejó el mail en otra parte del sitio, p. ej. "No es magia".
//    origen "bug" = "Reportá un bug de tu negocio": trae un mensaje y cada reporte se guarda aparte.
// El envío del PDF por mail se suma en el paso siguiente.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ORIGENES = new Set(["no-es-magia", "bug"]);
const MAX_MENSAJE = 600;
const LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;
const hits = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > LIMIT;
}

export async function POST(request: Request) {
  let email = "";
  let consultaId = "";
  let origen = "";
  let mensaje = "";
  try {
    const body = await request.json();
    email = String(body?.email ?? "").trim().toLowerCase().slice(0, 200);
    consultaId = String(body?.consultaId ?? "").trim();
    origen = String(body?.origen ?? "").trim();
    mensaje = String(body?.mensaje ?? "").replace(/<[^>]*>/g, "").trim().slice(0, MAX_MENSAJE);
  } catch {
    return NextResponse.json({ error: "pedido-invalido" }, { status: 400 });
  }

  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "email-invalido" }, { status: 400 });
  const conConsulta = /^[0-9a-f-]{36}$/i.test(consultaId);
  if (!conConsulta && !ORIGENES.has(origen)) return NextResponse.json({ error: "origen-invalido" }, { status: 400 });
  if (origen === "bug" && mensaje.length < 3) return NextResponse.json({ error: "mensaje-vacio" }, { status: 400 });

  const visitante = hashIp(getClientIp(request));
  if (rateLimited(visitante)) return NextResponse.json({ error: "limite" }, { status: 429 });

  const sql = getSql();
  if (!sql) return NextResponse.json({ error: "sin-base" }, { status: 503 });

  try {
    if (!conConsulta && origen === "bug") {
      await sql`insert into leads (email, notas, visitante)
                values (${email}, ${"Origen: bug — " + mensaje}, ${visitante})`;
      // Mails después de responder: aviso a Ailén (desde avisos@, responder = la persona) + confirmación.
      after(async () => {
        const toAdmin = adminBugEmail(email, mensaje);
        const toClient = clientBugEmail(mensaje);
        await Promise.all([
          sendEmail({ to: adminInbox(), fromEmail: internalSender(), fromName: "Sitio · bug reportado", replyTo: email, ...toAdmin }),
          sendEmail({ to: email, replyTo: adminInbox(), ...toClient }),
        ]);
      });
      return NextResponse.json({ ok: true });
    }

    if (!conConsulta) {
      const existing = (await sql`
        select 1 from leads where lower(email) = ${email} and consulta_id is null
          and notas = ${"Origen: " + origen} limit 1`) as unknown[];
      if (existing.length === 0) {
        await sql`insert into leads (email, notas, visitante) values (${email}, ${"Origen: " + origen}, ${visitante})`;
      }
      return NextResponse.json({ ok: true });
    }

    const rows = (await sql`
      insert into leads (email, consulta_id, tarea, modulos, resumen, visitante)
      select ${email}, c.id, c.tarea, c.modulos, c.resumen, ${visitante}
      from consultas c where c.id = ${consultaId}
      on conflict (lower(email), consulta_id) do nothing
      returning id`) as { id: number }[];

    if (rows.length > 0) return NextResponse.json({ ok: true });

    // ¿Ya lo teníamos? (mismo mail, misma consulta) → ok, sin duplicar.
    const existing = (await sql`
      select 1 from leads where lower(email) = ${email} and consulta_id = ${consultaId} limit 1`) as unknown[];
    if (existing.length > 0) return NextResponse.json({ ok: true });

    // La consulta no está registrada (Neon tardó o falló): el contacto se guarda igual, sin arquitectura.
    await sql`insert into leads (email, notas, visitante)
              values (${email}, ${"Consulta no registrada: " + consultaId}, ${visitante})`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.warn("[leads] no se pudo guardar:", (error as Error).message);
    return NextResponse.json({ error: "no-guardado" }, { status: 503 });
  }
}
