// Catálogo de módulos que Ailén construye. La IA del demo SOLO puede elegir de acá.
// Para sumar/quitar un módulo, editá esta lista: no hay que tocar nada más.
export type Modulo = {
  id: string;
  label: string; // etiqueta corta de la tarjeta (mayúsculas)
  nombre: string;
  resuelve: string; // cómo lo leería la clienta
};

export const CATALOGO: Modulo[] = [
  { id: "bot-whatsapp", label: "BOT", nombre: "Bot de WhatsApp", resuelve: "Contesta lo repetido a cualquier hora y te pasa lo que te necesita" },
  { id: "bandeja", label: "INBOX", nombre: "Bandeja unificada", resuelve: "WhatsApp, Instagram y mail en un solo lugar" },
  { id: "crm", label: "CRM", nombre: "CRM de clientes", resuelve: "Quién consultó, qué pidió y en qué quedó" },
  { id: "seguimiento", label: "FLOW", nombre: "Seguimiento automático", resuelve: "Vuelve a escribir cuando alguien no respondió" },
  { id: "agenda", label: "AGENDA", nombre: "Agenda con reglas", resuelve: "Turnos que respetan tu semana; reservan solos" },
  { id: "recordatorios", label: "AVISOS", nombre: "Recordatorios y confirmaciones", resuelve: "Menos ausencias, menos “¿seguimos en pie?”" },
  { id: "presupuestador", label: "PRESUPUESTOS", nombre: "Presupuestador", resuelve: "Presupuestos en minutos con tus precios cargados" },
  { id: "plantillas", label: "PLANTILLAS", nombre: "Plantillas vivas", resuelve: "Documentos y mensajes que se completan solos" },
  { id: "cobros", label: "COBROS", nombre: "Cobros y recordatorios de pago", resuelve: "El sistema recuerda; vos no perseguís" },
  { id: "facturacion", label: "ARCA", nombre: "Facturación ARCA", resuelve: "Cada venta con su factura, sin cargar dos veces" },
  { id: "stock", label: "STOCK", nombre: "Stock en tiempo real", resuelve: "Un solo número entre local, depósito y web" },
  { id: "pedidos", label: "PEDIDOS", nombre: "Gestión de pedidos", resuelve: "Del pedido al envío, cada paso con estado" },
  { id: "tienda", label: "TIENDA", nombre: "Tienda online integrada", resuelve: "Una web que vende y se conecta al resto" },
  { id: "panel", label: "PANEL", nombre: "Panel de control", resuelve: "Ventas, pendientes y alertas en una pantalla" },
  { id: "reportes", label: "REPORTES", nombre: "Reportes automáticos", resuelve: "Los números de la semana te llegan solos" },
  { id: "tareas", label: "EQUIPO", nombre: "Tareas del equipo", resuelve: "Quién hace qué, sin preguntarlo por WhatsApp" },
  { id: "erp", label: "ERP", nombre: "Sistema de gestión a medida", resuelve: "Todo conectado, con la lógica de tu negocio" },
];

export const MODULOS_POR_ID = new Map(CATALOGO.map((m) => [m.id, m]));
