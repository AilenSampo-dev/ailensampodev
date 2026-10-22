import { randomUUID } from "crypto";
import { after, NextResponse } from "next/server";
import { CATALOGO, MODULOS_POR_ID } from "@/content/sistema/catalogo";
import { getArchitectureForTask, type ArchCard, type GeneratedArchitecture } from "@/components/sections/demoTasks";
import { alertarUnaVez } from "@/lib/alertas";
import { getSql } from "@/lib/db";
import { getClientIp, hashIp } from "@/lib/ip";

// Generador del demo "Te lo demuestro".
// Proveedor compatible con la API de OpenAI (Groq por defecto). Cambiar de proveedor = cambiar variables:
//   AI_API_KEY (o GROQ_API_KEY) · AI_BASE_URL · AI_MODEL
// Si no hay key, falla o tarda, responde con las reglas locales (fuente "reglas").
// Cada respuesta se registra en Neon (tabla consultas) DESPUÉS de responder, sin demorar a la persona.

const BASE_URL = process.env.AI_BASE_URL ?? "https://api.groq.com/openai/v1";
// llama-3.3-70b-versatile fue dado de baja por Groq (2026). Modelos de producción: openai/gpt-oss-20b / -120b.
// Si Groq da de baja este también, la IA responde 404 y el demo cae a reglas: cambiar AI_MODEL en .env.local.
const MODEL = process.env.AI_MODEL ?? "openai/gpt-oss-20b";
const IS_REASONING = MODEL.startsWith("openai/gpt-oss");
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


// Fallas de configuración (no se arreglan esperando) → mail a Ailén, máx. 1 por día por tipo.
function avisarFalla(status: number) {
  const casos: Record<number, [string, string, string, string]> = {
    404: ["ia-modelo", "La IA del demo dejó de responder: modelo no disponible",
      `Groq respondió 404 para el modelo "${MODEL}" (probablemente lo dio de baja). El demo "Te lo demuestro" está usando las reglas de respaldo.`,
      "Entrá a console.groq.com/docs/models, elegí un modelo de producción y cargalo como AI_MODEL en las variables de entorno de Vercel (y en .env.local). Después redeployá."],
    401: ["ia-clave", "La IA del demo dejó de responder: clave inválida",
      "Groq rechazó la clave (401). El demo está usando las reglas de respaldo.",
      "Generá una clave nueva en console.groq.com y reemplazá GROQ_API_KEY en Vercel (y en .env.local). Después redeployá."],
    403: ["ia-clave", "La IA del demo dejó de responder: acceso denegado",
      "Groq rechazó el pedido (403). El demo está usando las reglas de respaldo.",
      "Revisá en console.groq.com que la cuenta y la clave sigan activas."],
    429: ["ia-cupo", "La IA del demo llegó al límite del plan gratuito",
      "Groq respondió 429 (cupo agotado). Hasta que se renueve, el demo usa las reglas de respaldo.",
      "Si pasa seguido, mirá el uso en console.groq.com → Limits. Puede ser tráfico real (buena noticia) o alguien abusando del demo."],
  };
  const caso = casos[status];
  if (!caso) return; // 5xx o caídas temporales: no avisar
  const [tipo, asunto, detalle, queHacer] = caso;
  after(() => alertarUnaVez(tipo, asunto, detalle, queHacer));
}

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
        // gpt-oss razona antes de responder: razonamiento corto y margen de tokens para que llegue al JSON.
        max_tokens: IS_REASONING ? 1500 : 500,
        ...(IS_REASONING ? { reasoning_effort: "low" } : {}),
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: task },
        ],
      }),
    });
    if (!response.ok) {
      avisarFalla(response.status);
      console.warn(
        "[arquitectura] proveedor IA respondió",
        response.status,
        response.status === 404 ? `— el modelo "${MODEL}" no existe o fue dado de baja: cambiá AI_MODEL` : "",
      );
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
