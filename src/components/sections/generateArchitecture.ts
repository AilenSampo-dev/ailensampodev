import { getArchitectureForTask, resolveDemoTaskLabel, type GeneratedArchitecture } from "./demoTasks";

const CLIENT_TIMEOUT_MS = 10000;

function fromRules(task: string): GeneratedArchitecture {
  return { ...getArchitectureForTask(task), source: "reglas" };
}

/** Pide la arquitectura al servidor (IA o reglas, registrada en Neon). Sin red o con límite, usa reglas locales. Nunca rechaza. */
export async function generateArchitecture(rawTask: string): Promise<GeneratedArchitecture> {
  const task = resolveDemoTaskLabel(rawTask);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

  try {
    const response = await fetch("/api/arquitectura", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task }),
      signal: controller.signal,
    });
    if (!response.ok) return fromRules(task);

    const data = (await response.json()) as Partial<GeneratedArchitecture> & { id?: string };
    if (!Array.isArray(data.cards) || data.cards.length < 3 || !data.valueText) return fromRules(task);
    return {
      cards: [data.cards[0], data.cards[1], data.cards[2]],
      valueText: data.valueText,
      source: data.source === "ia" ? "ia" : "reglas",
      consultaId: data.id,
    };
  } catch {
    return fromRules(task);
  } finally {
    clearTimeout(timer);
  }
}
