// Tags = chips del mockup (viven en DemoSection, sellado). Si cambian allá, cambiarlos acá.
export const DEMO_TASK_TAGS = [
  "Respuestas infinitas",
  "Clientes que se pierden",
  "Plantillas que nadie ve",
  "Reuniones sin control",
  "Cobros que demoran",
] as const;

export type DemoTaskTag = (typeof DEMO_TASK_TAGS)[number];

export const DEFAULT_DEMO_TASK: DemoTaskTag = DEMO_TASK_TAGS[0];

export type ArchCard = {
  label: string;
  title: string;
  desc: string;
  dot: "rose" | "yellow" | "aqua";
};

export type ArchitectureBlueprint = {
  cards: [ArchCard, ArchCard, ArchCard];
  valueText: string;
};

/** Resultado que ve la persona: "ia" = generado con IA sobre el catálogo; "reglas" = respaldo local. */
export type GeneratedArchitecture = ArchitectureBlueprint & {
  source: "ia" | "reglas";
  /** id de la consulta registrada en el servidor (para asociar el lead). Ausente si se generó solo en el navegador. */
  consultaId?: string;
};

const BLUEPRINTS: Record<DemoTaskTag, ArchitectureBlueprint> = {
  "Respuestas infinitas": {
    cards: [
      { label: "BOT", title: "Lo repetido, resuelto", desc: "Horarios, precios y envíos se contestan solos, a cualquier hora", dot: "rose" },
      { label: "FLOW", title: "Derivación con criterio", desc: "Lo que necesita tu mirada te llega marcado; lo demás, no", dot: "yellow" },
      { label: "CRM", title: "Historial por cliente", desc: "Quién escribió, qué pidió y qué quedó pendiente", dot: "aqua" },
    ],
    valueText:
      "Dejás de contestar lo mismo veinte veces por día. El sistema responde lo repetible y te avisa solo lo que te necesita.",
  },
  "Clientes que se pierden": {
    cards: [
      { label: "CAPTURA", title: "Cada consulta registrada", desc: "Venga de WhatsApp, Instagram o mail, queda anotada", dot: "rose" },
      { label: "FLOW", title: "Seguimiento automático", desc: "Si alguien no respondió, el sistema vuelve a escribir", dot: "yellow" },
      { label: "CRM", title: "Estado de cada cliente", desc: "Consultó, recibió presupuesto, compró: todo a la vista", dot: "aqua" },
    ],
    valueText:
      "Ninguna venta se cae porque el mensaje quedó en visto. El seguimiento lo hace el sistema, no tu memoria.",
  },
  "Plantillas que nadie ve": {
    cards: [
      { label: "BASE", title: "Un solo lugar", desc: "Presupuestos, mensajes y documentos ordenados y al día", dot: "rose" },
      { label: "FLOW", title: "Se completan solas", desc: "Con los datos del cliente, listas para enviar", dot: "yellow" },
      { label: "REGISTRO", title: "Qué se usó y cuándo", desc: "Qué se envió, a quién y en qué quedó", dot: "aqua" },
    ],
    valueText:
      "Lo que armaste una vez trabaja todas las veces. Sin buscar archivos, sin copiar y pegar.",
  },
  "Reuniones sin control": {
    cards: [
      { label: "AGENDA", title: "Turnos con reglas", desc: "Duración, horarios y pausas que respetan tu semana", dot: "rose" },
      { label: "FLOW", title: "Reservan solos", desc: "Eligen un horario libre sin ida y vuelta de mensajes", dot: "yellow" },
      { label: "AVISOS", title: "Confirmación y recordatorio", desc: "Menos ausencias, reprogramación sin perseguir a nadie", dot: "aqua" },
    ],
    valueText:
      "Tu agenda se ordena sin que la estés coordinando. Llegás a la reunión, no a organizarla.",
  },
  "Cobros que demoran": {
    cards: [
      { label: "REGISTRO", title: "Cada venta con su estado", desc: "Pagado, pendiente o vencido, sin revisar el banco", dot: "rose" },
      { label: "FLOW", title: "Recordatorios de pago", desc: "El sistema avisa antes y después del vencimiento", dot: "yellow" },
      { label: "CAJA", title: "Lo que entra, a la vista", desc: "Quién debe, cuánto y desde cuándo", dot: "aqua" },
    ],
    valueText:
      "Dejás de perseguir pagos a mano. El sistema recuerda; vos entrás solo cuando hace falta.",
  },
};

const KEYWORD_RULES: { pattern: RegExp; tag: DemoTaskTag }[] = [
  { pattern: /cobr|factur|pag[oa]|deud|venc|transfer/i, tag: "Cobros que demoran" },
  { pattern: /reuni|turno|agenda|cita|reserv|horario|calendario/i, tag: "Reuniones sin control" },
  { pattern: /plantilla|presup|cotiz|document|pdf|archivo|contrato/i, tag: "Plantillas que nadie ve" },
  { pattern: /cliente|venta|seguim|lead|perd|visto|olvid/i, tag: "Clientes que se pierden" },
  { pattern: /whats|consult|mensaj|respond|respuest|pregunt|instagram|mail|dm/i, tag: "Respuestas infinitas" },
];

function matchTag(task: string): DemoTaskTag | null {
  const normalized = task.trim();
  const exact = DEMO_TASK_TAGS.find((tag) => tag.toLowerCase() === normalized.toLowerCase());
  if (exact) return exact;
  for (const rule of KEYWORD_RULES) {
    if (rule.pattern.test(normalized)) return rule.tag;
  }
  return null;
}

function customBlueprint(task: string): ArchitectureBlueprint {
  return {
    cards: [
      { label: "ENTRADA", title: "Todo entra por un lugar", desc: "Lo que hoy está repartido entre chats, mails y planillas", dot: "rose" },
      { label: "FLOW", title: "Las reglas de tu negocio", desc: "Lo repetible se resuelve solo; las excepciones te llegan a vos", dot: "yellow" },
      { label: "PANEL", title: "Todo a la vista", desc: "Alertas y estado de cada cosa, sin depender de tu memoria", dot: "aqua" },
    ],
    valueText: `Para “${task}”, el sistema se diseña después de entender cómo lo resolvés hoy. Esto es el punto de partida.`,
  };
}

export function resolveDemoTaskLabel(task: string): string {
  return task.trim() || DEFAULT_DEMO_TASK;
}

export function getArchitectureForTask(task: string): ArchitectureBlueprint {
  const label = resolveDemoTaskLabel(task);
  const tag = matchTag(label);
  return tag ? BLUEPRINTS[tag] : customBlueprint(label);
}
