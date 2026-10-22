// Catálogo de módulos que Ailén construye. La IA del demo SOLO puede elegir de acá.
// "noElegirSi": cuándo NO corresponde aunque se parezca (evita errores como "captación → agenda").
// Para sumar/quitar un módulo, editá esta lista. Mapa completo: doc "Mapa de consultas del demo".
export type Modulo = {
  id: string;
  label: string; // etiqueta corta de la tarjeta (mayúsculas)
  nombre: string;
  resuelve: string; // cómo lo leería la clienta
  noElegirSi: string;
};

export const CATALOGO: Modulo[] = [
  // Atención y mensajes
  { id: "bot-whatsapp", label: "BOT", nombre: "Bot de WhatsApp", resuelve: "Contesta lo repetido a cualquier hora y te pasa lo que te necesita", noElegirSi: "la persona no recibe consultas repetidas por mensaje" },
  { id: "bandeja", label: "INBOX", nombre: "Bandeja unificada", resuelve: "WhatsApp, Instagram y mail en un solo lugar", noElegirSi: "usa un solo canal de mensajes" },
  // Captación y ventas
  { id: "captura", label: "CAPTURA", nombre: "Captura de consultas", resuelve: "Formulario, landing y mensajes de redes que caen solos al CRM", noElegirSi: "ya recibe consultas y el problema es responderlas o seguirlas" },
  { id: "crm", label: "CRM", nombre: "CRM de clientes", resuelve: "Quién consultó, qué pidió y en qué quedó", noElegirSi: "el problema es solo de stock, facturación o turnos" },
  { id: "seguimiento", label: "FLOW", nombre: "Seguimiento automático", resuelve: "Vuelve a escribir cuando alguien no respondió", noElegirSi: "no pierde clientes por falta de seguimiento" },
  { id: "presupuestador", label: "PRESUPUESTOS", nombre: "Presupuestador", resuelve: "Presupuestos en minutos con tus precios cargados", noElegirSi: "no arma presupuestos" },
  { id: "plantillas", label: "PLANTILLAS", nombre: "Plantillas vivas", resuelve: "Documentos y mensajes que se completan solos", noElegirSi: "no repite documentos ni mensajes" },
  // Presencia digital
  { id: "sitio-web", label: "WEB", nombre: "Sitio web conectado", resuelve: "Una web que vende y guarda cada contacto", noElegirSi: "solo pide redes o contenido" },
  { id: "tienda", label: "TIENDA", nombre: "Tienda online integrada", resuelve: "Una web que vende y se conecta al resto", noElegirSi: "vende servicios o solo en local" },
  { id: "medicion", label: "MEDICIÓN", nombre: "Medición", resuelve: "Saber de dónde viene cada venta (GA4, SEO básico)", noElegirSi: "no tiene web ni tienda" },
  // Turnos
  { id: "agenda", label: "AGENDA", nombre: "Agenda con reglas", resuelve: "Turnos que respetan tu semana; reservan solos", noElegirSi: "no habla de turnos, reuniones ni horarios" },
  { id: "recordatorios", label: "AVISOS", nombre: "Recordatorios y confirmaciones", resuelve: "Menos ausencias, menos “¿seguimos en pie?”", noElegirSi: "no trabaja con turnos ni fechas comprometidas" },
  { id: "senas", label: "SEÑAS", nombre: "Señas para reservar", resuelve: "El turno se confirma cuando paga la seña", noElegirSi: "no trabaja con turnos" },
  // Cobros y facturación
  { id: "cobros", label: "COBROS", nombre: "Cobros y recordatorios de pago", resuelve: "El sistema recuerda; vos no perseguís", noElegirSi: "le pagan al momento y no tiene deudas pendientes" },
  { id: "links-pago", label: "PAGOS", nombre: "Links de pago", resuelve: "Cobrás con Mercado Pago sin pedir comprobantes", noElegirSi: "el problema es facturar, no cobrar" },
  { id: "cuotas", label: "CUOTAS", nombre: "Cuotas y suscripciones", resuelve: "Cobros mensuales que se generan solos", noElegirSi: "vende por única vez" },
  { id: "facturacion", label: "ARCA", nombre: "Facturación ARCA", resuelve: "Cada venta con su factura, sin cargar dos veces", noElegirSi: "no menciona facturar" },
  // Stock y logística
  { id: "stock", label: "STOCK", nombre: "Stock en tiempo real", resuelve: "Un solo número entre local, depósito y web", noElegirSi: "no vende productos físicos" },
  { id: "pedidos", label: "PEDIDOS", nombre: "Gestión de pedidos", resuelve: "Del pedido al envío, cada paso con estado", noElegirSi: "no maneja pedidos" },
  { id: "envios", label: "ENVÍOS", nombre: "Envíos", resuelve: "Etiquetas y seguimiento sin cargar dos veces", noElegirSi: "solo vende en local" },
  { id: "compras", label: "COMPRAS", nombre: "Proveedores y compras", resuelve: "Qué reponer, a quién y cuándo", noElegirSi: "no maneja stock" },
  // Números
  { id: "panel", label: "PANEL", nombre: "Panel de control", resuelve: "Ventas, pendientes y alertas en una pantalla", noElegirSi: "ya hay otro módulo que muestra lo que necesita ver" },
  { id: "reportes", label: "REPORTES", nombre: "Reportes automáticos", resuelve: "Los números de la semana te llegan solos", noElegirSi: "no pide ver números" },
  { id: "costos", label: "COSTOS", nombre: "Costos y precios", resuelve: "Cuánto te cuesta cada cosa y cuánto cobrar", noElegirSi: "ya sabe su margen y le falta vender" },
  // Clientes y postventa
  { id: "postventa", label: "POSTVENTA", nombre: "Postventa y recompra", resuelve: "Mensaje después de la compra, reseñas, volver a comprar", noElegirSi: "todavía no tiene clientes" },
  { id: "campanas", label: "CAMPAÑAS", nombre: "Campañas a clientes", resuelve: "Mensajes a tu base con permiso, sin spam", noElegirSi: "pide que le hagan el contenido" },
  { id: "fichas", label: "FICHAS", nombre: "Fichas de clientes", resuelve: "Historial privado de cada persona que atendés", noElegirSi: "vende productos, no servicios" },
  // Equipo y núcleo
  { id: "tareas", label: "EQUIPO", nombre: "Tareas del equipo", resuelve: "Quién hace qué, sin preguntarlo por WhatsApp", noElegirSi: "trabaja sola y no delega" },
  { id: "integraciones", label: "INTEGRACIONES", nombre: "Integraciones", resuelve: "Tus herramientas hablando entre sí", noElegirSi: "usa una sola herramienta" },
  { id: "erp", label: "ERP", nombre: "Sistema de gestión a medida", resuelve: "Todo conectado, con la lógica de tu negocio", noElegirSi: "el dolor es puntual y lo resuelve un módulo chico" },
];

export const MODULOS_POR_ID = new Map(CATALOGO.map((m) => [m.id, m]));
