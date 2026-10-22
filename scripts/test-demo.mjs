// Prueba del demo "Te lo demuestro": corre 24 consultas contra /api/arquitectura y puntúa la IA.
// Uso: con `npm run dev` corriendo, en otra terminal → npm run test:demo
// Otra URL (ej. una versión de prueba de Vercel): npm run test:demo -- https://….vercel.app
// Necesita DEMO_TEST_TOKEN en .env.local (y el mismo en el servidor): sin límite de usos y sin registrar en Neon.
// Criterio: pasa si ningún módulo está en "nunca" y al menos 2 de 3 están en "esperados" (3/3 = perfecta).

// 127.0.0.1 y no "localhost": `next dev -H 0.0.0.0` escucha solo IPv4 y Node prueba primero ::1 (IPv6).
const BASE = (process.argv[2] || process.env.DEMO_TEST_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const TOKEN = process.env.DEMO_TEST_TOKEN;
// Pausa entre consultas. El plan gratuito de Groq limita tokens por minuto: con el catálogo de 30 módulos,
// cada consulta usa ~3.000. Ojo: la prueba consume el MISMO cupo que el demo en producción.
const PAUSA_MS = Number(process.env.DEMO_TEST_PAUSA_MS) || 12000;

const CASOS = [
  ["captación de clientes", ["captura", "crm", "seguimiento", "bandeja"], ["agenda"]],
  ["me escriben por Instagram y se me pierden", ["bandeja", "captura", "crm", "seguimiento"], ["stock"]],
  ["contesto lo mismo todo el día", ["bot-whatsapp", "bandeja", "plantillas", "crm"], ["facturacion"]],
  ["no me pagan a tiempo", ["cobros", "links-pago", "panel", "cuotas"], ["agenda"]],
  ["cobro por transferencia y no sé quién pagó", ["cobros", "links-pago", "panel"], ["bot-whatsapp"]],
  ["facturo a mano en ARCA", ["facturacion", "pedidos", "panel", "integraciones"], ["agenda"]],
  ["se me pisan los turnos", ["agenda", "recordatorios", "senas"], ["stock"]],
  ["los pacientes faltan sin avisar", ["recordatorios", "senas", "agenda"], ["tienda"]],
  ["vendo cosas que no tengo en stock", ["stock", "pedidos", "tienda", "compras"], ["agenda"]],
  ["vendo en el local, en Instagram y en la web y no cuadra nada", ["stock", "integraciones", "pedidos", "erp", "tienda"], ["agenda"]],
  ["no sé si gano plata", ["costos", "panel", "reportes"], ["bot-whatsapp"]],
  ["no sé cuánto cobrar", ["costos", "presupuestador", "panel"], ["stock"]],
  ["armar presupuestos me lleva horas", ["presupuestador", "plantillas", "crm"], ["stock"]],
  ["mi socio no anota nada y no sabemos quién debe qué", ["cobros", "panel", "crm", "tareas"], ["bot-whatsapp"]],
  ["todo depende de mí", ["tareas", "panel", "erp", "integraciones"], ["tienda"]],
  ["no tengo web", ["sitio-web", "captura", "crm", "tienda"], ["facturacion"]],
  ["mi web no vende", ["medicion", "captura", "tienda", "sitio-web", "seguimiento"], ["agenda"]],
  ["los clientes no vuelven a comprar", ["postventa", "campanas", "crm"], ["agenda"]],
  ["doy cursos y cobro las cuotas a mano", ["cuotas", "links-pago", "crm", "cobros"], ["stock"]],
  ["soy psicóloga y llevo las fichas en papel", ["fichas", "agenda", "recordatorios"], ["tienda"]],
  ["todo está en Excel", ["erp", "integraciones", "panel", "crm"], []],
  ["todo es un caos", ["erp", "crm", "panel", "tareas"], [], { primero: ["erp", "crm"] }],
  ["necesito más seguidores", ["captura", "crm", "campanas"], ["stock"], { tipos: ["mixta", "charla"] }],
  ["haceme el logo", [], [], { tipos: ["charla"] }],
];

if (!TOKEN) {
  console.error("Falta DEMO_TEST_TOKEN en .env.local. Sin eso el límite de 8 por hora corta la prueba.");
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pasan = 0, perfectas = 0, porReglas = 0;
const fallas = [];

console.log(`Probando ${CASOS.length} consultas contra ${BASE} (una cada ${PAUSA_MS / 1000}s, tarda ~${Math.ceil((CASOS.length * PAUSA_MS) / 60000)} min)\n`);
for (const [i, [consulta, esperados, nunca, extra = {}]] of CASOS.entries()) {
  let data;
  try {
    // El servidor avisa con data.cupo = true cuando Groq respondió 429: esperamos y reintentamos (hasta 3 veces).
    for (let intento = 1; ; intento++) {
      const res = await fetch(`${BASE}/api/arquitectura`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-test": TOKEN },
        body: JSON.stringify({ task: consulta }),
      });
      data = await res.json();
      if (!res.ok) throw new Error(`HTTP ${res.status} ${JSON.stringify(data)}`);
      if (!data.cupo || intento > 3) break;
      const espera = Math.min(90, Math.max(15, Number(data.reintentarEn) || 30));
      console.log(`   … Groq sin cupo, espero ${espera}s y reintento`);
      await sleep(espera * 1000);
    }
  } catch (error) {
    const causa = error.cause?.code || error.cause?.message || error.message;
    if (i === 0 && /ECONNREFUSED|ENOTFOUND|fetch failed/i.test(String(causa))) {
      console.error(`No pude conectar con ${BASE} (${causa}). ¿Está corriendo "npm run dev" en otra terminal?`);
      process.exit(1);
    }
    fallas.push(`#${i + 1} "${consulta}": error ${causa}`);
    console.log(`✗ #${i + 1} ${consulta} → error (${causa})`);
    continue;
  }

  const tipo = data.tipo || "sistema";
  const ids = tipo === "charla" ? [] : (data.cards || []).map((c) => c.id).filter(Boolean);
  if (data.source !== "ia") porReglas++;

  let ok, motivo = "";
  if (extra.tipos) {
    const tipoOk = extra.tipos.includes(tipo);
    const malos = ids.filter((id) => nunca.includes(id));
    ok = tipoOk && malos.length === 0;
    if (!tipoOk) motivo = `tipo "${tipo}" (esperaba ${extra.tipos.join(" o ")})`;
    else if (malos.length) motivo = `eligió ${malos.join(", ")}`;
  } else {
    const aciertos = ids.filter((id) => esperados.includes(id)).length;
    const malos = ids.filter((id) => nunca.includes(id));
    const primeroOk = !extra.primero || extra.primero.includes(ids[0]);
    ok = tipo !== "charla" && malos.length === 0 && aciertos >= 2 && primeroOk;
    if (ok && aciertos === 3) perfectas++;
    if (tipo === "charla") motivo = "respondió charla";
    else if (malos.length) motivo = `eligió ${malos.join(", ")} (nunca)`;
    else if (aciertos < 2) motivo = `solo ${aciertos}/3 esperados`;
    else if (!primeroOk) motivo = `empezó por ${ids[0]}`;
  }

  if (ok) pasan++;
  else fallas.push(`#${i + 1} "${consulta}": ${motivo} → [${ids.join(", ") || tipo}]`);
  console.log(`${ok ? "✓" : "✗"} #${i + 1} ${consulta} → ${tipo === "charla" ? "charla" : ids.join(" + ")}${data.source !== "ia" ? "  (reglas)" : ""}`);
  await sleep(PAUSA_MS); // respeta el límite de tokens por minuto de Groq
}

console.log(`\nResultado: ${pasan}/${CASOS.length} pasan · ${perfectas} perfectas (3/3)`);
if (porReglas) console.log(`Ojo: ${porReglas} respondieron por reglas, no por IA (revisá la terminal del servidor).`);
if (fallas.length) console.log("\nA revisar:\n- " + fallas.join("\n- "));
process.exit(pasan === CASOS.length ? 0 : 1);
