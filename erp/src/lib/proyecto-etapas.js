/** Pipeline comercial y de entrega — s(a) · editable por proyecto */

export const ETAPAS_PIPELINE = [
  {
    id: "lead",
    orden: 1,
    titulo: "Lead / Contacto inicial",
    resumen: "Canal, fecha y dolor declarado (lo que pide, no lo que necesita).",
    campos: [
      { key: "canal", label: "CANAL", type: "text", placeholder: "Referido, web, WhatsApp…" },
      { key: "fecha", label: "FECHA CONTACTO", type: "date" },
      { key: "dolorDeclarado", label: "DOLOR DECLARADO POR EL CLIENTE", type: "textarea", placeholder: "Lo que pide en sus palabras…" },
      { key: "notas", label: "NOTAS", type: "textarea" },
    ],
  },
  {
    id: "diagnostico",
    orden: 2,
    titulo: "Diagnóstico",
    resumen: "Hipótesis, alcance detectado y si encaja en el modelo s(a).",
    campos: [
      { key: "hipotesis", label: "HIPÓTESIS PREVIAS A LA REUNIÓN", type: "textarea" },
      { key: "alcanceDetectado", label: "ALCANCE REAL DETECTADO", type: "textarea" },
      {
        key: "encaja",
        label: "¿ENCJA EN NÚCLEO / SUPERFICIES / OPERACIÓN?",
        type: "select",
        options: [
          { value: "", label: "— pendiente —" },
          { value: "si", label: "Sí — sigue a propuesta" },
          { value: "no", label: "No encaja — cerrar acá" },
        ],
      },
      { key: "notas", label: "NOTAS", type: "textarea" },
    ],
  },
  {
    id: "propuesta",
    orden: 3,
    titulo: "Propuesta en construcción",
    resumen: "Alcance cerrado, demo, precio vs referencia de construcción, fee mensual piso.",
    campos: [
      { key: "alcanceCerrado", label: "ALCANCE CERRADO", type: "textarea" },
      { key: "demoHtml", label: "DEMO HTML / LINK", type: "text", placeholder: "URL o ruta del HTML" },
      { key: "precioReferenciaConstruccion", label: "PRECIO VS VALOR REF. CONSTRUCCIÓN (USD)", type: "number" },
      { key: "estructuraPago", label: "ESTRUCTURA DE PAGO", type: "textarea", placeholder: "40/40/20, bonificaciones…" },
      { key: "feeMensualPiso", label: "FEE MENSUAL PISO (USD)", type: "number" },
      { key: "versionPropuesta", label: "VERSIÓN DE LA PROPUESTA", type: "text", required: true, placeholder: "v1, v2…" },
      { key: "notas", label: "NOTAS", type: "textarea" },
    ],
  },
  {
    id: "enviada",
    orden: 4,
    titulo: "Enviada",
    resumen: "Fecha de envío y vigencia para medir tiempos de decisión.",
    campos: [
      { key: "fechaEnvio", label: "FECHA DE ENVÍO", type: "date" },
      { key: "vigenciaHasta", label: "VIGENCIA HASTA", type: "date" },
      { key: "notas", label: "NOTAS", type: "textarea" },
    ],
  },
  {
    id: "negociacion",
    orden: 5,
    titulo: "Negociación",
    resumen: "Bonificación de implementación ≠ fee mensual. Cambios post-demo = producción.",
    campos: [
      { key: "bonificacionImplementacion", label: "BONIFICACIÓN DE IMPLEMENTACIÓN", type: "textarea", placeholder: "Qué se bonifica y por qué" },
      { key: "feeMensualInnegociable", label: "FEE MENSUAL (INNEGOCIABLE)", type: "number" },
      {
        key: "cambiosPostDemoProduccion",
        label: "CAMBIOS POST-DEMO → TRABAJO DE PRODUCCIÓN",
        type: "textarea",
        placeholder: "Todo cambio solicitado después de la demo se registra acá como producción, no ajuste gratis",
      },
      { key: "notas", label: "NOTAS", type: "textarea" },
    ],
  },
  {
    id: "firmada",
    orden: 6,
    titulo: "Firmada / Contrato",
    resumen: "Documento formal con cláusula de control de cambios.",
    campos: [
      { key: "documentoRef", label: "REFERENCIA CONTRATO / ADDENDUM", type: "text", placeholder: "Enlace ERP contrato firmado" },
      { key: "clausulaControlCambios", label: "CLÁUSULA CONTROL DE CAMBIOS", type: "textarea", placeholder: "Mecanismo ticket / addendum obligatorio" },
      { key: "fechaFirma", label: "FECHA FIRMA", type: "date" },
      { key: "notas", label: "NOTAS", type: "textarea" },
    ],
  },
  {
    id: "kickoff",
    orden: 7,
    titulo: "Kickoff",
    resumen: "Cronograma, milestones atados a pagos, bonificaciones aplicadas.",
    campos: [
      { key: "cronograma", label: "CRONOGRAMA", type: "textarea" },
      { key: "milestones", label: "MILESTONES / PAGOS (40·40·20)", type: "textarea" },
      { key: "bonificacionesAplicadas", label: "BONIFICACIONES APLICADAS", type: "textarea" },
      { key: "notas", label: "NOTAS", type: "textarea" },
    ],
  },
  {
    id: "produccion",
    orden: 8,
    titulo: "Producción / Mantenimiento",
    resumen: "Fee mensual activo, ticketing y SLA.",
    campos: [
      { key: "feeMensualActivo", label: "FEE MENSUAL ACTIVO (USD)", type: "number" },
      { key: "ticketing", label: "MESA DE TICKETS / CANAL", type: "text" },
      { key: "sla", label: "SLA / ACUERDOS DE SOPORTE", type: "textarea" },
      { key: "notas", label: "NOTAS", type: "textarea" },
    ],
  },
  {
    id: "cambio_alcance",
    orden: 9,
    titulo: "Cambio de alcance",
    resumen: "Transición obligatoria de vuelta a Propuesta cuando algo no estaba en el Anexo.",
    campos: [
      { key: "descripcionCambio", label: "QUÉ SE PIDE AGREGAR", type: "textarea", required: true },
      { key: "motivo", label: "POR QUÉ NO ESTABA EN ANEXO A", type: "textarea" },
      { key: "ticketRef", label: "TICKET / REFERENCIA", type: "text" },
      { key: "notas", label: "NOTAS", type: "textarea" },
    ],
    esTransicion: true,
  },
];

export const ETAPA_BY_ID = Object.fromEntries(ETAPAS_PIPELINE.map((e) => [e.id, e]));

export function etapaLabel(id) {
  return ETAPA_BY_ID[id]?.titulo || id || "—";
}

export function datosVaciosEtapa(etapaId) {
  const etapa = ETAPA_BY_ID[etapaId];
  if (!etapa) return {};
  return Object.fromEntries(etapa.campos.map((c) => [c.key, ""]));
}

export function crearPipelineInicial(etapaActualId = "lead") {
  const datos = {};
  for (const e of ETAPAS_PIPELINE) datos[e.id] = datosVaciosEtapa(e.id);
  return {
    etapaActualId,
    datos,
    historial: [],
    actualizadoEn: new Date().toISOString(),
  };
}

/** Mapea proyectos existentes (Stockin, etc.) al pipeline sin perder datos. */
export function asegurarPipeline(proyecto, cliente) {
  if (proyecto.pipeline?.etapaActualId && proyecto.pipeline?.datos) {
    return proyecto.pipeline;
  }

  const pipeline = crearPipelineInicial("lead");
  const p = pipeline.datos;

  if (proyecto.estado === "Producción" || proyecto.estado === "Mantenimiento") {
    pipeline.etapaActualId = "produccion";
    p.produccion.feeMensualActivo = String(cliente?.feeMensual || proyecto.feeMensual || "");
    p.produccion.notas = proyecto.notas || "";
  } else if (proyecto.estado === "En construcción") {
    pipeline.etapaActualId = "kickoff";
    p.kickoff.notas = proyecto.notas || "";
  } else if (proyecto.contratoEstado === "aceptado") {
    pipeline.etapaActualId = "firmada";
    p.firmada.fechaFirma = proyecto.contratoAceptacion?.fecha?.slice(0, 10) || "";
    p.firmada.documentoRef = "Contrato ERP — firmado";
  } else if (proyecto.contratoEstado === "enviado") {
    pipeline.etapaActualId = "enviada";
  } else if (proyecto.estado === "Propuesta") {
    pipeline.etapaActualId = "propuesta";
    p.propuesta.feeMensualPiso = String(cliente?.feeMensual || "");
  }

  p.propuesta.precioReferenciaConstruccion = String(proyecto.feeConstruccion || "");
  pipeline.actualizadoEn = new Date().toISOString();
  return pipeline;
}

export function estadoLegacyDesdePipeline(etapaActualId) {
  switch (etapaActualId) {
    case "lead":
    case "diagnostico":
    case "propuesta":
    case "enviada":
    case "negociacion":
      return "Propuesta";
    case "firmada":
    case "kickoff":
    case "cambio_alcance":
      return "En construcción";
    case "produccion":
      return "Producción";
    default:
      return "Propuesta";
  }
}

export function validarCamposEtapa(etapaId, datos = {}) {
  const etapa = ETAPA_BY_ID[etapaId];
  if (!etapa) return [];
  const faltantes = [];
  for (const c of etapa.campos) {
    if (!c.required) continue;
    const v = datos[c.key];
    if (v === undefined || v === null || String(v).trim() === "") {
      faltantes.push(c.label);
    }
  }
  if (etapaId === "diagnostico" && datos.encaja === "no") {
    return ["Marcá el proyecto como cerrado: no encaja en el modelo."];
  }
  if (etapaId === "negociacion" && !String(datos.feeMensualInnegociable || "").trim()) {
    faltantes.push("FEE MENSUAL (INNEGOCIABLE)");
  }
  return faltantes;
}

export function indiceEtapa(etapaId) {
  return ETAPAS_PIPELINE.findIndex((e) => e.id === etapaId);
}

export function avanzarEtapa(pipeline, destinoId) {
  const origenId = pipeline.etapaActualId;
  const faltantes = validarCamposEtapa(origenId, pipeline.datos[origenId] || {});
  if (faltantes.length) return { ok: false, error: `Completá: ${faltantes.join(", ")}` };

  if (ETAPA_BY_ID[destinoId]?.id === "cambio_alcance") {
    return registrarCambioAlcance(pipeline);
  }

  const historial = [
    ...(pipeline.historial || []),
    { desde: origenId, hasta: destinoId, en: new Date().toISOString() },
  ];

  return {
    ok: true,
    pipeline: {
      ...pipeline,
      etapaActualId: destinoId,
      historial,
      actualizadoEn: new Date().toISOString(),
    },
  };
}

/** Etapa 9 → vuelve a Propuesta en construcción con registro en historial. */
export function registrarCambioAlcance(pipeline) {
  const datosCambio = pipeline.datos.cambio_alcance || {};
  const faltantes = validarCamposEtapa("cambio_alcance", datosCambio);
  if (faltantes.length) return { ok: false, error: `Completá: ${faltantes.join(", ")}` };

  const notaCambio = datosCambio.descripcionCambio || "Cambio de alcance";
  const propuesta = {
    ...datosVaciosEtapa("propuesta"),
    ...pipeline.datos.propuesta,
    alcanceCerrado: `[CAMBIO DE ALCANCE] ${notaCambio}`,
    versionPropuesta: "",
    notas: `Reapertura desde cambio de alcance (${new Date().toLocaleDateString("es-AR")}). ${datosCambio.notas || ""}`.trim(),
  };

  const historial = [
    ...(pipeline.historial || []),
    {
      desde: pipeline.etapaActualId,
      hasta: "propuesta",
      tipo: "cambio_alcance",
      en: new Date().toISOString(),
      nota: notaCambio,
    },
  ];

  return {
    ok: true,
    pipeline: {
      ...pipeline,
      etapaActualId: "propuesta",
      datos: {
        ...pipeline.datos,
        propuesta,
        cambio_alcance: { ...datosVaciosEtapa("cambio_alcance"), ...datosCambio },
      },
      historial,
      actualizadoEn: new Date().toISOString(),
    },
  };
}

export function siguienteEtapaId(etapaActualId) {
  const idx = indiceEtapa(etapaActualId);
  if (idx < 0 || idx >= ETAPAS_PIPELINE.length - 1) return null;
  const next = ETAPAS_PIPELINE[idx + 1];
  if (next.id === "cambio_alcance") return null;
  return next.id;
}

export function mergePipelineEnProyecto(proyecto, pipeline) {
  const etapaActualId = pipeline.etapaActualId;
  const estado = estadoLegacyDesdePipeline(etapaActualId);
  const propuesta = pipeline.datos?.propuesta || {};
  const negociacion = pipeline.datos?.negociacion || {};

  return {
    ...proyecto,
    pipeline,
    estado,
    feeConstruccion: propuesta.precioReferenciaConstruccion || proyecto.feeConstruccion,
    ...(negociacion.feeMensualInnegociable
      ? { feeMensualProyecto: Number(negociacion.feeMensualInnegociable) }
      : {}),
  };
}
