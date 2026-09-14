import { bytesToBase64 } from "./pdf-utils.js";

export const ESTADOS_PAGO = ["pendiente", "pagado", "parcial"];
export const MONEDAS = ["USD", "ARS"];

export function mesActual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function crearMesFacturacion(mes = mesActual()) {
  return {
    id: Math.random().toString(36).slice(2, 9),
    mes,
    servicioDesde: "",
    servicioHasta: "",
    etapa: "",
    documentoDetalle: {
      numero: "",
      fechaEmision: "",
      enviadoAlCliente: false,
      fechaEnvio: "",
      adjunto: null,
    },
    importe: {
      moneda: "USD",
      subtotal: "",
      iva: "",
      total: "",
      tipoCambioBna: "",
      totalArs: "",
    },
    facturaFiscal: {
      emitida: false,
      tipo: "",
      puntoVenta: "",
      numero: "",
      cae: "",
      vencimientoCae: "",
      adjunto: null,
    },
    pago: {
      estado: "pendiente",
      fecha: "",
      montoCobrado: "",
      comprobantes: [],
    },
    notas: "",
  };
}

export function ordenarMeses(facturacion = []) {
  return [...facturacion].sort((a, b) => (b.mes || "").localeCompare(a.mes || ""));
}

export async function leerAdjunto(file) {
  if (!file) return null;
  const bytes = new Uint8Array(await file.arrayBuffer());
  return {
    id: Math.random().toString(36).slice(2, 9),
    nombre: file.name,
    mime: file.type || "application/pdf",
    base64: bytesToBase64(bytes),
    subidoEn: new Date().toISOString(),
  };
}

export function etiquetaMes(mes) {
  if (!mes || !/^\d{4}-\d{2}$/.test(mes)) return mes || "—";
  const [y, m] = mes.split("-");
  const nombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${nombres[Number(m) - 1]} ${y}`;
}

export function resumenMes(registro) {
  const total = registro?.importe?.total;
  const moneda = registro?.importe?.moneda || "USD";
  const pago = registro?.pago?.estado || "pendiente";
  const docs =
    Number(!!registro?.documentoDetalle?.adjunto) +
    Number(!!registro?.facturaFiscal?.adjunto) +
    (registro?.pago?.comprobantes?.length || 0);
  return { total, moneda, pago, docs };
}
