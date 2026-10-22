import { randomUUID } from "crypto";
import { after, NextResponse } from "next/server";
import { CATALOGO, MODULOS_POR_ID } from "@/content/sistema/catalogo";
import { CHARLA_TEXT, MIXTA_TEXT } from "@/content/sistema/textos";
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

const SYSTEM_PROMPT = `Sos el motor del demo del sitio de Ailén Sampó, arquitecta de sistemas digitales a medida
(sistemas de gestión, automatizaciones, agentes de WhatsApp, webs y tiendas conectadas, facturación ARCA, integraciones).
Una persona describe lo que le roba tiempo en su negocio. Tu trabajo es mostrarle qué sistema lo resuelve.

PASO 1 — Nombrá el dolor real en una frase corta ("dolor"): qué le pasa, no qué módulo querés poner.
PASO 2 — Decidí el "tipo":
- "sistema": el dolor se resuelve con módulos del catálogo.
- "mixta": una parte se resuelve con módulos y otra no es de sistemas (contenido, diseño, redes, contabilidad, legales).
  Elegí los módulos solo para la parte de sistemas.
- "charla": no es de sistemas, no se entiende, o no hay forma honesta de resolverlo con el catálogo. Sin módulos.
PASO 3 — Si es "sistema" o "mixta", elegí EXACTAMENTE 3 módulos que ataquen ESE dolor de forma directa, en orden
entrada (cómo llega) → proceso (qué hace el sistema) → resultado (qué ve ella). No elijas un módulo por parecido:
respetá su "no elegir si". Si la consulta es vaga ("todo es un caos", "no sé por dónde empezar"), el primero es crm o erp.

Catálogo (usá solo estos ids):
${CATALOGO.map((m) => `- ${m.id}: ${m.nombre}. Resuelve: ${m.resuelve}. NO elegir si: ${m.noElegirSi}.`).join("\n")}

Voz: español rioplatense con voseo, cálido y preciso, sin jerga, sin exclamaciones ni emojis. Hablale a "vos".
Palabras prohibidas → usá en su lugar: "citas" → "turnos"; "prospecto"/"lead" → "cliente"/"consulta";
"almacena"/"gestiona"/"optimiza" → lo que pasa en su día ("te avisa", "queda anotado", "se completa solo");
"usuario" → "vos" o "tu clienta". Sin promesas de tiempo ni de resultados ("en 2 semanas", "vas a vender el doble").
- "porque": por qué ese módulo resuelve SU caso, mencionando lo que escribió, máximo 80 caracteres.
- "resumen": una frase de máximo 160 caracteres sobre cómo cambia su día cuando el sistema trabaja por ella.

Respondé SOLO JSON:
{"tipo":"sistema|mixta|charla","dolor":"...","modulos":[{"id":"...","porque":"..."}, ...],"resumen":"..."}
Con "charla", "modulos" va vacío y "resumen" vacío.`;

type AiResult = {
  tipo: "sistema" | "mixta" | "charla";
  dolor: string;
  modulos: { id: string; porque: string }[];
  resumen: string;
};

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
  const tipo = data.tipo === "mixta" || data.tipo === "charla" ? data.tipo : "sistema";
  const dolor = clean(data.dolor, 160);
  if (tipo === "charla") return { tipo, dolor, modulos: [], resumen: "" };
  if (!Array.isArray(data.modulos)) return null;
  const seen = new Set<string>();
  const modulos = data.modulos
    .filter((m) => m && MODULOS_POR_ID.has(m.id) && !seen.has(m.id) && seen.add(m.id))
    .slice(0, 3)
    .map((m) => ({ id: m.id, porque: clean(m.porque, 90) || MODULOS_POR_ID.get(m.id)!.resuelve }));
  if (modulos.length < 3) return null;
  return { tipo, dolor, modulos, resumen: clean(data.resumen, 180) };
}

const DOTS: ArchCard["dot"][] = ["rose", "yellow", "aqua"];

// Respuestas repetidas (los chips mandan siempre el mismo texto): se reusan 24 h en vez de pedirle de nuevo a la IA.
// En memoria por instancia del servidor; alcanza para bajar mucho el consumo de cupo.
const CACHE_MS = 24 * 60 * 60 * 1000;
const cache = new Map<string, { at: number; result: AiResult }>();
const cacheKey = (task: string) => task.toLowerCase().replace(/\s+/g, " ").trim();


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

let ultimoCupo: { hasta: number; segundos: number } | null = null;

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
      if (response.status === 429) {
        const segundos = Number(response.headers.get("retry-after")) || 30;
        ultimoCupo = { hasta: Date.now() + segundos * 1000, segundos };
      }
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
  if (ai.tipo === "charla") {
    // Sin módulos: la pantalla muestra la invitación a charlar. Las tarjetas genéricas quedan solo de respaldo.
    return { ...getArchitectureForTask(task), source: "ia", tipo: "charla", nota: CHARLA_TEXT };
  }
  const cards = ai.modulos.map((m, i) => {
    const modulo = MODULOS_POR_ID.get(m.id)!;
    return { id: m.id, label: modulo.label, title: modulo.nombre, desc: m.porque, dot: DOTS[i % 3] };
  });
  return {
    cards: [cards[0], cards[1], cards[2]],
    valueText: ai.resumen || getArchitectureForTask(task).valueText,
    source: "ia",
    tipo: ai.tipo,
    nota: ai.tipo === "mixta" ? MIXTA_TEXT : undefined,
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

  // Pruebas automáticas (npm run test:demo): con el token correcto no hay límite ni se registra en Neon.
  const testToken = process.env.DEMO_TEST_TOKEN;
  const isTest = Boolean(testToken) && request.headers.get("x-demo-test") === testToken;

  const visitante = hashIp(getClientIp(request));
  if (!isTest && rateLimited(visitante)) {
    return NextResponse.json({ error: "limite" }, { status: 429 });
  }

  const apiKey = process.env.AI_API_KEY ?? process.env.GROQ_API_KEY;
  const key = cacheKey(task);
  const cached = cache.get(key);
  let ai: AiResult | null = cached && Date.now() - cached.at < CACHE_MS ? cached.result : null;
  if (!ai && apiKey) {
    ai = await askAi(task, apiKey);
    if (ai) cache.set(key, { at: Date.now(), result: ai });
  }
  const sinCupo = !ai && ultimoCupo !== null && Date.now() < ultimoCupo.hasta;
  const architecture: GeneratedArchitecture = ai
    ? toArchitecture(ai, task)
    : { ...getArchitectureForTask(task), source: "reglas" };
  const id = randomUUID();

  after(async () => {
    const sql = getSql();
    if (!sql || isTest) return;
    try {
      const modulos =
        architecture.tipo === "charla" ? [] : architecture.cards.map(({ label, title, desc }) => ({ label, title, desc }));
      await sql`insert into consultas (id, tarea, fuente, modulos, resumen, visitante)
                values (${id}, ${task}, ${architecture.source}, ${JSON.stringify(modulos)}::jsonb,
                        ${architecture.tipo === "charla" ? "[charla] " + CHARLA_TEXT : architecture.valueText}, ${visitante})`;
    } catch (error) {
      console.warn("[arquitectura] no se pudo registrar la consulta:", (error as Error).message);
    }
  });

  // Solo para la prueba automática: le avisa que hubo 429 para que espere y reintente.
  const extraTest = isTest && sinCupo ? { cupo: true, reintentarEn: ultimoCupo?.segundos } : {};
  return NextResponse.json({ id, ...architecture, ...extraTest });
}
