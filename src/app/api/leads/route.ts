import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { getClientIp, hashIp } from "@/lib/ip";

// Guarda el mail de quien pide el PDF de su arquitectura. Los datos de la arquitectura se toman de la
// consulta ya registrada (no de lo que mande el navegador). El ERP lee esta tabla.
// El envío del PDF por mail se suma en el paso siguiente.

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
