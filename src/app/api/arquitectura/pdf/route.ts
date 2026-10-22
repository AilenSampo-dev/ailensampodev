import { after, NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { adminPdfEmail, clientPdfEmail } from "@/lib/email/arquitectura";
import { adminInbox, internalSender, sendEmail } from "@/lib/email/brevo";
import { getClientIp, hashIp } from "@/lib/ip";
import { crearArquitecturaPdf } from "@/lib/pdf/arquitecturaPdf";

// PDF "Tu arquitectura": genera el PDF con la consulta registrada (no con lo que mande el navegador),
// lo manda a la clienta y una copia a Ailén, y registra el lead. Mail obligatorio.

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
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

type Consulta = { id: string; tarea: string; fuente: string; modulos: { label: string; title: string; desc: string }[]; resumen: string | null };

export async function POST(request: Request) {
  let email = "";
  let consultaId = "";
  try {
    const body = await request.json();
    email = String(body?.email ?? "").trim().toLowerCase().slice(0, 200);
    consultaId = String(body?.consultaId ?? "").trim();
  } catch {
    return NextResponse.json({ error: "pedido-invalido" }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "email-invalido" }, { status: 400 });
  if (!/^[0-9a-f-]{36}$/i.test(consultaId)) return NextResponse.json({ error: "consulta-invalida" }, { status: 400 });

  const visitante = hashIp(getClientIp(request));
  if (rateLimited(visitante)) return NextResponse.json({ error: "limite" }, { status: 429 });

  const sql = getSql();
  if (!sql) return NextResponse.json({ error: "sin-base" }, { status: 503 });

  try {
    const rows = (await sql`
      select id, tarea, fuente, modulos, resumen from consultas where id = ${consultaId} limit 1`) as Consulta[];
    const consulta = rows[0];
    if (!consulta) return NextResponse.json({ error: "consulta-no-encontrada" }, { status: 404 });

    const pdf = await crearArquitecturaPdf({
      tarea: consulta.tarea,
      modulos: consulta.modulos,
      resumen: consulta.resumen,
      fecha: new Date(),
    });
    const attachments = [{ name: "tu-arquitectura-ailen-sampo.pdf", content: Buffer.from(pdf).toString("base64") }];

    const toClient = clientPdfEmail(consulta.tarea, consulta.modulos);
    const enviado = await sendEmail({ to: email, replyTo: adminInbox(), attachments, ...toClient });
    if (!enviado) return NextResponse.json({ error: "no-enviado" }, { status: 502 });

    after(async () => {
      try {
        await sql`
          insert into leads (email, consulta_id, tarea, modulos, resumen, visitante, pdf_enviado_at)
          values (${email}, ${consulta.id}, ${consulta.tarea}, ${JSON.stringify(consulta.modulos)}::jsonb,
                  ${consulta.resumen}, ${visitante}, now())
          on conflict (lower(email), consulta_id) do update set pdf_enviado_at = now()`;
      } catch (error) {
        console.warn("[pdf] no se pudo registrar el lead:", (error as Error).message);
      }
      const toAdmin = adminPdfEmail(email, consulta.tarea, consulta.modulos, consulta.fuente);
      await sendEmail({
        to: adminInbox(),
        fromEmail: internalSender(),
        fromName: "Sitio · arquitectura pedida",
        replyTo: email,
        attachments,
        ...toAdmin,
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[pdf] falló:", (error as Error).message);
    return NextResponse.json({ error: "fallo" }, { status: 500 });
  }
}
