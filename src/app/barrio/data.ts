// Datos de ejemplo del directorio del barrio (modo demo).
// En la versión real esto sale de la base de datos y lo cargan las emprendedoras desde /barrio/alta.

export type Rubro =
  | "Comida"
  | "Belleza"
  | "Hogar y oficios"
  | "Niños"
  | "Mascotas"
  | "Salud y bienestar"
  | "Moda"
  | "Clases"
  | "Tecnología"
  | "Eventos"
  | "Autos y motos"
  | "Profesionales"
  | "Arte y regalos"
  | "Alquileres";

export const RUBROS: Rubro[] = [
  "Comida",
  "Belleza",
  "Hogar y oficios",
  "Niños",
  "Mascotas",
  "Salud y bienestar",
  "Moda",
  "Clases",
  "Tecnología",
  "Eventos",
  "Autos y motos",
  "Profesionales",
  "Arte y regalos",
  "Alquileres",
];

// Degradé de portada por rubro (paleta s(a)) — reemplaza a las fotos en la demo.
export const PORTADAS: Record<Rubro, [string, string]> = {
  Comida: ["#FFD7C9", "#FF6437"],
  Belleza: ["#F9C6E6", "#F656BF"],
  "Hogar y oficios": ["#CFE0FF", "#6882EB"],
  Niños: ["#FAF26F", "#FFB98A"],
  Mascotas: ["#ABE3D2", "#6FC4A8"],
  "Salud y bienestar": ["#E1ADFF", "#AEBFF2"],
  Moda: ["#F9C6E6", "#E1ADFF"],
  Clases: ["#FAF26F", "#ABE3D2"],
  Tecnología: ["#AEBFF2", "#5C64F2"],
  Eventos: ["#FFD7C9", "#F656BF"],
  "Autos y motos": ["#D9D9E0", "#4D4F54"],
  Profesionales: ["#E1ADFF", "#6882EB"],
  "Arte y regalos": ["#FAF26F", "#F656BF"],
  Alquileres: ["#ABE3D2", "#AEBFF2"],
};

export type Ficha = {
  slug: string;
  nombre: string;
  rubro: Rubro;
  descripcion: string;
  manzana: string;
  modalidad: string;
  horarios: string;
  entrega: string;
  pagos: string;
  ofrece: string[];
  fotos: string[]; // títulos de las fotos (en la demo se muestran como degradés)
  whatsapp: string; // solo dígitos, con código de país
  instagram?: string;
};

export const FICHAS: Ficha[] = [
  {
    slug: "tortas-de-la-flor",
    nombre: "Tortas de la Flor",
    rubro: "Comida",
    descripcion: "Tortas, budines y mesas dulces por encargo para cumples y eventos del barrio. Opciones sin TACC con aviso de 72 h.",
    manzana: "12",
    modalidad: "Retiro y envío",
    horarios: "Lun a sáb · 9 a 19 h",
    entrega: "Retiro en casa · envío dentro del barrio",
    pagos: "Efectivo · transferencia · Mercado Pago",
    ofrece: ["Tortas de cumple", "Mesas dulces", "Budines", "Sin TACC"],
    fotos: ["Torta de cumple", "Mesa dulce", "Budines", "Torta temática", "Sin TACC", "Cajas de regalo"],
    whatsapp: "5493510000000",
    instagram: "tortasdelaflor",
  },
  {
    slug: "viandas-caseras-mili",
    nombre: "Viandas Caseras Mili",
    rubro: "Comida",
    descripcion: "Viandas semanales caseras. Retirás o te las llevo dentro del barrio.",
    manzana: "30",
    modalidad: "Envío en el barrio",
    horarios: "Pedidos hasta el domingo",
    entrega: "Envío dentro del barrio",
    pagos: "Efectivo · transferencia",
    ofrece: ["Viandas semanales", "Menú vegetariano", "Postres"],
    fotos: ["Vianda del día", "Menú semanal", "Postres", "Packaging"],
    whatsapp: "5493510000000",
  },
  {
    slug: "unas-by-caro",
    nombre: "Uñas by Caro",
    rubro: "Belleza",
    descripcion: "Semipermanente, kapping y esculpidas. Turnos de lunes a sábado.",
    manzana: "7",
    modalidad: "En su casa",
    horarios: "Lun a sáb · 10 a 20 h",
    entrega: "Atiende en su casa",
    pagos: "Efectivo · transferencia",
    ofrece: ["Semipermanente", "Kapping", "Esculpidas"],
    fotos: ["Diseño floral", "Francesitas", "Nude", "Esculpidas", "Kapping", "Espacio"],
    whatsapp: "5493510000000",
    instagram: "unasbycaro",
  },
  {
    slug: "electricidad-martin",
    nombre: "Electricidad Martín",
    rubro: "Hogar y oficios",
    descripcion: "Instalaciones, tableros y urgencias en el día.",
    manzana: "21",
    modalidad: "A domicilio",
    horarios: "Lun a vie · 8 a 18 h · urgencias todos los días",
    entrega: "Voy a domicilio",
    pagos: "Efectivo · transferencia",
    ofrece: ["Instalaciones", "Tableros", "Urgencias"],
    fotos: ["Tablero", "Iluminación", "Instalación"],
    whatsapp: "5493510000000",
  },
  {
    slug: "jardin-y-riego-nico",
    nombre: "Jardín y riego Nico",
    rubro: "Hogar y oficios",
    descripcion: "Corte de pasto, poda e instalación de riego.",
    manzana: "4",
    modalidad: "A domicilio",
    horarios: "Lun a sáb · 8 a 17 h",
    entrega: "Voy a domicilio",
    pagos: "Efectivo · transferencia",
    ofrece: ["Corte de pasto", "Poda", "Riego"],
    fotos: ["Jardín", "Riego", "Poda", "Antes y después", "Cerco"],
    whatsapp: "5493510000000",
  },
  {
    slug: "apoyo-escolar-sol",
    nombre: "Apoyo escolar Sol",
    rubro: "Clases",
    descripcion: "Primaria y secundaria. Matemática y lengua.",
    manzana: "18",
    modalidad: "Presencial y online",
    horarios: "Lun a vie · 14 a 19 h",
    entrega: "En su casa u online",
    pagos: "Efectivo · transferencia",
    ofrece: ["Primaria", "Secundaria", "Matemática", "Lengua"],
    fotos: ["Espacio de estudio", "Materiales"],
    whatsapp: "5493510000000",
  },
  {
    slug: "cumples-burbuja",
    nombre: "Cumples Burbuja",
    rubro: "Eventos",
    descripcion: "Animación, inflables y mesa temática para cumples infantiles.",
    manzana: "25",
    modalidad: "Vamos a tu casa",
    horarios: "Fines de semana y feriados",
    entrega: "Vamos a tu casa o al SUM",
    pagos: "Efectivo · transferencia · Mercado Pago",
    ofrece: ["Animación", "Inflables", "Mesa temática"],
    fotos: ["Inflable", "Mesa temática", "Animación", "Globos", "Burbujas", "Juegos"],
    whatsapp: "5493510000000",
    instagram: "cumplesburbuja",
  },
  {
    slug: "paseos-coffee-and-co",
    nombre: "Paseos Coffee & Co",
    rubro: "Mascotas",
    descripcion: "Paseos grupales por la mañana y guardería de fin de semana.",
    manzana: "9",
    modalidad: "Retiro en tu casa",
    horarios: "Lun a vie · 8 a 11 h",
    entrega: "Paso a buscarlo",
    pagos: "Efectivo · transferencia",
    ofrece: ["Paseos", "Guardería", "Cuidado por día"],
    fotos: ["Paseo grupal", "Plaza", "Guardería", "Descanso"],
    whatsapp: "5493510000000",
  },
  {
    slug: "yoga-en-la-plaza",
    nombre: "Yoga en la plaza",
    rubro: "Salud y bienestar",
    descripcion: "Clases al aire libre martes y jueves a la mañana.",
    manzana: "Plaza central",
    modalidad: "Grupal",
    horarios: "Mar y jue · 9 h",
    entrega: "En la plaza central",
    pagos: "Efectivo · transferencia",
    ofrece: ["Yoga", "Respiración", "Clases grupales"],
    fotos: ["Clase en la plaza", "Grupo", "Mat"],
    whatsapp: "5493510000000",
  },
  {
    slug: "ropa-circular-ana",
    nombre: "Ropa circular Ana",
    rubro: "Moda",
    descripcion: "Ropa de niños y adultos en muy buen estado. Probador en casa.",
    manzana: "14",
    modalidad: "Retiro",
    horarios: "Coordinar por WhatsApp",
    entrega: "Retiro en casa",
    pagos: "Efectivo · transferencia",
    ofrece: ["Ropa de niños", "Ropa de adultos", "Calzado"],
    fotos: ["Perchero", "Niños", "Abrigos", "Calzado", "Accesorios", "Probador"],
    whatsapp: "5493510000000",
  },
  {
    slug: "pc-y-celus-fran",
    nombre: "PC y celus Fran",
    rubro: "Tecnología",
    descripcion: "Arreglo de computadoras, celulares y redes wifi.",
    manzana: "2",
    modalidad: "A domicilio",
    horarios: "Lun a sáb · 10 a 19 h",
    entrega: "Voy a domicilio o retiro el equipo",
    pagos: "Efectivo · transferencia",
    ofrece: ["Computadoras", "Celulares", "Wifi"],
    fotos: ["Taller", "Repuestos", "Wifi"],
    whatsapp: "5493510000000",
  },
  {
    slug: "contadora-laura",
    nombre: "Contadora Laura",
    rubro: "Profesionales",
    descripcion: "Monotributo, facturación y declaraciones.",
    manzana: "11",
    modalidad: "Online y presencial",
    horarios: "Lun a vie · 9 a 17 h",
    entrega: "Online o en su casa",
    pagos: "Transferencia",
    ofrece: ["Monotributo", "Facturación", "Declaraciones"],
    fotos: ["Oficina"],
    whatsapp: "5493510000000",
  },
];

export function portada(rubro: Rubro, i = 0): string {
  const [a, b] = PORTADAS[rubro];
  const angulo = 135 + i * 30;
  return `linear-gradient(${angulo}deg, ${a}, ${b})`;
}

export function linkWhatsApp(f: Ficha): string {
  const texto = encodeURIComponent(`Hola! Te encontré en el directorio del barrio. Quería consultarte por ${f.nombre}.`);
  return `https://wa.me/${f.whatsapp}?text=${texto}`;
}
