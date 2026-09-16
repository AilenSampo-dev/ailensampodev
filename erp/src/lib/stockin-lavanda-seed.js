import { generarContratoHtml, generarAddendumElixioHtml } from "./contrato-template.js";
import { asegurarFacturacionStockin } from "./facturacion-stockin-seed.js";
import { asegurarPipeline } from "./proyecto-etapas.js";

export const STOCKIN_CLIENT_ID = "c-stockin-lavanda";
export const STOCKIN_PROJECT_ID = "p-stockin-erp";

export function buildStockinLavandaData() {
  const clienteBase = {
    id: STOCKIN_CLIENT_ID,
    negocio: "Stockin Lavanda",
    representante: "Claudio Raul Sampo",
    email: "",
    contacto: "",
    cuit: "",
    slug: "stockin-lavanda",
    estado: "Activo",
    feeMensual: 1500,
    notas: "ERP + Elixio Coins · licencia USD 1.500/mes",
    alta: "2026-07-01",
    facturacion: [],
  };

  const cliente = {
    ...clienteBase,
    facturacion: asegurarFacturacionStockin(clienteBase, []),
  };

  const contratoHtml = generarContratoHtml({
    cliente,
    proyecto: { nombre: "ERP Stockin Lavanda", tipo: "ERP" },
  });

  const proyectoBase = {
    id: STOCKIN_PROJECT_ID,
    clienteId: STOCKIN_CLIENT_ID,
    nombre: "ERP Stockin Lavanda",
    tipo: "ERP",
    estado: "Producción",
    feeConstruccion: 15400,
    cobrado: 0,
    repo: "https://erp.stockinlavanda.com.ar",
    notas: "Producción · facturación jul–ago 2026 seed",
    contratoHtml,
    contratoEstado: "aceptado",
    contratoAceptacion: {
      typedName: "Claudio Raul Sampo",
      clientEmail: cliente.email || "—",
      contentHash: "",
      contratoHtmlAceptado: contratoHtml,
      fecha: "10 de agosto de 2026, 12:00:00",
      registro: {
        id: "stockin-contrato-2026",
        subjectId: STOCKIN_PROJECT_ID,
        clientEmail: cliente.email || "—",
        typedName: "Claudio Raul Sampo",
        termsAccepted: true,
        acceptedAt: "2026-08-10T15:00:00.000Z",
        subject: {
          title: "ERP Stockin Lavanda",
          category: "ERP",
          value: 1500,
          valueCurrency: "USD",
        },
        client: {
          name: "Claudio Raul Sampo",
          email: cliente.email || "—",
          company: "Stockin Lavanda",
        },
      },
    },
    addendums: [
      {
        id: "add-elixio-coins",
        slug: "elixio-coins",
        titulo: "Addendum — Programa Elixio Coins",
        html: generarAddendumElixioHtml({
          cliente,
          proyecto: { nombre: "ERP Stockin Lavanda", tipo: "ERP" },
        }),
        estado: "borrador",
        contratoOriginalFecha: "10 de agosto de 2026",
        firmaToken: null,
        enviadoAt: null,
        enviadoA: null,
        aceptacion: null,
      },
    ],
  };

  const proyecto = {
    ...proyectoBase,
    pipeline: asegurarPipeline(proyectoBase, cliente),
  };

  return { clientes: [cliente], proyectos: [proyecto] };
}

/** Inserta o reemplaza Stockin Lavanda sin tocar otros clientes. */
export function mergeStockinSeed(clientes = [], proyectos = []) {
  const seed = buildStockinLavandaData();
  const nextClientes = (clientes || []).filter(
    (c) => c.id !== STOCKIN_CLIENT_ID && String(c.slug || "").toLowerCase() !== "stockin-lavanda"
  );
  const nextProyectos = (proyectos || []).filter(
    (p) => p.id !== STOCKIN_PROJECT_ID && p.clienteId !== STOCKIN_CLIENT_ID
  );
  return {
    clientes: [...nextClientes, ...seed.clientes],
    proyectos: [...nextProyectos, ...seed.proyectos],
  };
}
