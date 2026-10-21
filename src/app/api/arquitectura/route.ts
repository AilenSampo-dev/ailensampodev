import { randomUUID } from "crypto";
import { after, NextResponse } from "next/server";
import { CATALOGO, MODULOS_POR_ID } from "@/content/sistema/catalogo";
import { getArchitectureForTask, type ArchCard, type GeneratedArchitecture } from "@/components/sections/demoTasks";
import { getSql } from "@/lib/db";
import { getClientIp, hashIp } from "@/lib/ip";

// Generador del demo "Te lo demuestro".
// Proveedor compatible con la API de OpenAI (Groq por defecto). Cambiar de proveedor = cambiar variables:
//   AI_API_KEY (o GROQ_API_KEY) · AI_BASE_URL · AI_MODEL
// Si no hay key, falla o tarda, responde con las reglas locales (fuente "reglas").
// Cada respuesta se registra en Neon (tabla consultas) DESPUÉS de responder, sin demorar a la persona.

const BASE_URL = process.env.AI_BASE_URL ?? "https://api.groq.com/openai/v1";
const MODEL = process.env.AI_MODEL ?? "llama-3.3-70b-versatile";
const TIMEOUT_MS = 7000;
const MAX_TASK = 280;

// Límite por visitante. En memoria: es por instancia del servidor, alcanza como freno básico.
const LIMIT = 8;
const WINDOW_MS = 60 * 60 * 1000;
const hits = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  return false;
}

const SYSTEM_PROMPT = `Sos el motor del demo del sitio de Ailén Sampó, arquitecta de sistemas digitales a medida.
Una persona describe la tarea que le roba tiempo en su negocio. Elegí EXACTAMENTE 3 módulos del catálogo que, juntos, la resuelven, en orden lógico (entrada → proceso → resultado).

Catálogo (usá solo estos ids):
${CATALOGO.map((m) => `- ${m.id}: ${m.nombre}. ${m.resuelve}`).join("\n")}

Reglas de voz: español rioplatense con voseo, cálido y preciso, sin jerga técnica, sin promesas exageradas, sin signos de exclamación ni emojis. Hablale a "vos".
- "porque": por qué ese módulo resuelve SU caso, concreto, máximo 80 caracteres.
- "resumen": una frase de máximo 160 caracteres sobre cómo cambia su día cuando el sistema trabaja por ella.
Si el texto no es una tarea de negocio (insulto, broma, vacío, otro idioma sin sentido), elegí bot-whatsapp, crm y panel con textos genéricos.

Respondé SOLO JSON con esta forma:
{"modulos":[{"id":"...","porque":"..."},{"id":"...","porque":"..."},{"id":"...","porque":"..."}],"resumen":"..."}`;

type AiResult = { modulos: { id: string; porque: string }[]; resumen: string };

function clean(text: unknown, max: number): string {
  return String(text ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function validate(raw: unknown): AiResult | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Partial<AiResult>;
  if (!Array.isArray(data.modulos)) return null;
  const seen = new Set<string>();
  const modulos = data.modulos
    .filter((m) => m && MODULOS_POR_ID.has(m.id) && !seen.has(m.id) && seen.add(m.id))
    .slice(0, 3)
    .map((m) => ({ id: m.id, porque: clean(m.porque, 90) || MODULOS_POR_ID.get(m.id)!.resuelve }));
  if (modulos.length < 3) return null;
  return { modulos, resumen: clean(data.resumen, 180) };
}

const DOTS: ArchCard["dot"][] = ["rose", "yellow", "aqua"];

async function askAi(task: string, apiKey: string): Promise<AiResult | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        max_tokens: 500,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: task },
        ],
      }),
    });
    if (!response.ok) {
      console.warn("[arquitectura] proveedor IA respondió", response.status);
      return null;
    }
    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    return validate(typeof content === "string" ? JSON.parse(content) : null);
  } catch (error) {
    console.warn("[arquitectura] falló la IA:", (error as Error).name);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function toArchitecture(ai: AiResult, task: string): GeneratedArchitecture {
  const cards = ai.modulos.map((m, i) => {
    const modulo = MODULOS_POR_ID.get(m.id)!;
    return { label: modulo.label, title: modulo.nombre, desc: m.porque, dot: DOTS[i % 3] };
  });
  return {
    cards: [cards[0], cards[1], cards[2]],
    valueText: ai.resumen || getArchitectureForTask(task).valueText,
    source: "ia",
  };
}

export async function POST(request: Request) {
  let task = "";
  try {
    const body = await request.json();
    task = clean(body?.task, MAX_TASK);
  } catch {
    return NextResponse.json({ error: "pedido-invalido" }, { status: 400 });
  }
  if (!task) return NextResponse.json({ error: "vacio" }, { status: 400 });

  const visitante = hashIp(getClientIp(request));
  if (rateLimited(visitante)) {
    return NextResponse.json({ error: "limite" }, { status: 429 });
  }

  const apiKey = process.env.AI_API_KEY ?? process.env.GROQ_API_KEY;
  const ai = apiKey ? await askAi(task, apiKey) : null;
  const architecture: GeneratedArchitecture = ai
    ? toArchitecture(ai, task)
    : { ...getArchitectureForTask(task), source: "reglas" };
  const id = randomUUID();

  after(async () => {
    const sql = getSql();
    if (!sql) return;
    try {
      const modulos = architecture.cards.map(({ label, title, desc }) => ({ label, title, desc }));
      await sql`insert into consultas (id, tarea, fuente, modulos, resumen, visitante)
                values (${id}, ${task}, ${architecture.source}, ${JSON.stringify(modulos)}::jsonb,
                        ${architecture.valueText}, ${visitante})`;
    } catch (error) {
      console.warn("[arquitectura] no se pudo registrar la consulta:", (error as Error).message);
    }
  });

  return NextResponse.json({ id, ...architecture });
}
