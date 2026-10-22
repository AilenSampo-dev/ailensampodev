import { readFile } from "fs/promises";
import path from "path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { CONTACT_EMAIL } from "@/lib/contacto";

// PDF "Tu arquitectura" (A4) con la marca de Ailén y sus fuentes: Egyptian Slate (títulos) y Nunito (texto).
// Los .ttf de src/lib/pdf/fonts se generaron desde public/fonts (woff2). Vercel los incluye por
// outputFileTracingIncludes en next.config.ts. Si faltan, cae a Helvetica sin romperse.
// Los emojis se quitan: no existen en estas fuentes.

const FONTS_DIR = path.join(process.cwd(), "src/lib/pdf/fonts");

async function loadFonts(pdf: PDFDocument) {
  try {
    pdf.registerFontkit(fontkit);
    const [titulo, tituloRegular, texto, textoBold] = await Promise.all(
      ["EgyptianSlate-Bold.ttf", "EgyptianSlate-Regular.ttf", "Nunito-Regular.ttf", "Nunito-ExtraBold.ttf"].map((file) =>
        readFile(path.join(FONTS_DIR, file)),
      ),
    );
    return {
      titulo: await pdf.embedFont(titulo, { subset: true }),
      tituloRegular: await pdf.embedFont(tituloRegular, { subset: true }),
      reg: await pdf.embedFont(texto, { subset: true }),
      bold: await pdf.embedFont(textoBold, { subset: true }),
      propias: true,
    };
  } catch (error) {
    console.warn("[pdf] no se pudieron cargar las fuentes propias, uso Helvetica:", (error as Error).message);
    const reg = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    return { titulo: bold, tituloRegular: reg, reg, bold, propias: false };
  }
}

type Modulo = { label: string; title: string; desc: string };
export type ArquitecturaPdfInput = { tarea: string; modulos: Modulo[]; resumen: string | null; fecha: Date };

const C = {
  violeta: rgb(0x3a / 255, 0x1e / 255, 0x66 / 255),
  oscuro: rgb(0x1e / 255, 0x0c / 255, 0x39 / 255),
  lila: rgb(0xe1 / 255, 0xad / 255, 0xff / 255),
  crema: rgb(0xff / 255, 0xfb / 255, 0xdb / 255),
  amarillo: rgb(0xfa / 255, 0xf2 / 255, 0x6f / 255),
  rosa: rgb(0xf6 / 255, 0x56 / 255, 0xbf / 255),
  aqua: rgb(0xab / 255, 0xe3 / 255, 0xd2 / 255),
  naranja: rgb(0xff / 255, 0x64 / 255, 0x37 / 255),
  blanco: rgb(1, 1, 1),
};

const W = 595.28;
const H = 841.89;
const M = 48;

let latin1Only = false;

/** Quita emojis (no están en las fuentes). Con Helvetica de respaldo, también lo que no sea Latin-1. */
function safe(text: string): string {
  const sinEmojis = text.replace(/\p{Extended_Pictographic}|\uFE0F|\u200D/gu, "");
  if (!latin1Only) return sinEmojis.replace(/\s+\n/g, "\n").trim();
  return sinEmojis
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D«»]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[^\x20-\x7E\u00A0-\u00FF\n]/g, "")
    .replace(/\s+\n/g, "\n")
    .trim();
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of safe(text).split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) <= maxWidth) line = next;
      else {
        if (line) lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
}

function drawLines(page: PDFPage, lines: string[], x: number, y: number, font: PDFFont, size: number, color = C.violeta, lh = 1.4) {
  lines.forEach((line, i) => page.drawText(line, { x, y: y - i * size * lh, size, font, color }));
  return y - lines.length * size * lh;
}

function dots(page: PDFPage, x: number, y: number) {
  [C.rosa, C.amarillo, C.aqua].forEach((color, i) => page.drawCircle({ x: x + i * 13, y, size: 4, color }));
}

export async function crearArquitecturaPdf({ tarea, modulos, resumen, fecha }: ArquitecturaPdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle("Tu arquitectura - Ailén Sampó");
  pdf.setAuthor("Ailén Sampó · Sistemas a medida");
  const page = pdf.addPage([W, H]);
  const { titulo, tituloRegular, reg, bold, propias } = await loadFonts(pdf);
  latin1Only = !propias;
  const mono = reg; // los "> prompts" van en Nunito, como la terminal del sitio

  // Fondo y barra de ventana
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: C.blanco });
  page.drawRectangle({ x: 0, y: H - 34, width: W, height: 34, color: C.oscuro });
  dots(page, M, H - 17);
  page.drawText("arquitectura.pdf", { x: M + 48, y: H - 21, size: 10, font: mono, color: C.blanco });

  let y = H - 86;
  page.drawText("SISTEMAS A MEDIDA", { x: M, y, size: 9, font: bold, color: C.violeta, opacity: 0.55 });
  y -= 34;
  page.drawText("Tu arquitectura", { x: M, y, size: 32, font: titulo, color: C.violeta });
  y -= 22;
  page.drawText(
    safe(`Generada el ${fecha.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })} en ailensampo.com`),
    { x: M, y, size: 10, font: reg, color: C.violeta, opacity: 0.7 },
  );

  // Tarea
  y -= 34;
  page.drawText("> Lo que te está robando tiempo", { x: M, y, size: 10, font: mono, color: C.violeta });
  const tareaLines = wrap(`"${tarea}"`, bold, 14, W - M * 2 - 32);
  const tareaH = tareaLines.length * 14 * 1.4 + 24;
  y -= 12;
  page.drawRectangle({ x: M, y: y - tareaH, width: W - M * 2, height: tareaH, color: C.crema });
  page.drawRectangle({ x: M, y: y - tareaH, width: 4, height: tareaH, color: C.amarillo });
  drawLines(page, tareaLines, M + 16, y - 26, bold, 14);
  y -= tareaH + 34;

  // Módulos
  page.drawText("> Los módulos que lo resuelven", { x: M, y, size: 10, font: mono, color: C.violeta });
  y -= 14;
  const dotColors = [C.rosa, C.amarillo, C.aqua];
  modulos.slice(0, 3).forEach((modulo, i) => {
    const descLines = wrap(modulo.desc, reg, 11, W - M * 2 - 40);
    const boxH = 58 + descLines.length * 11 * 1.4;
    page.drawRectangle({ x: M, y: y - boxH, width: W - M * 2, height: boxH, color: C.lila });
    page.drawCircle({ x: W - M - 18, y: y - 18, size: 4, color: dotColors[i % 3] });
    page.drawText(safe(`${i + 1} · ${modulo.label}`), { x: M + 18, y: y - 22, size: 9, font: mono, color: C.violeta });
    page.drawText(safe(modulo.title), { x: M + 18, y: y - 40, size: 15, font: titulo, color: C.violeta });
    drawLines(page, descLines, M + 18, y - 58, reg, 11);
    y -= boxH;
    if (i < Math.min(modulos.length, 3) - 1) {
      page.drawText("v", { x: W / 2 - 3, y: y - 15, size: 11, font: bold, color: C.violeta });
      y -= 20;
    } else {
      y -= 12;
    }
  });

  // Vos descansás + resumen
  page.drawRectangle({ x: W / 2 - 95, y: y - 30, width: 190, height: 30, color: C.amarillo });
  page.drawText("VOS DESCANSÁS", {
    x: W / 2 - titulo.widthOfTextAtSize("VOS DESCANSÁS", 12) / 2,
    y: y - 20,
    size: 12,
    font: titulo,
    color: C.violeta,
  });
  y -= 56;
  if (resumen) y = drawLines(page, wrap(resumen, reg, 12, W - M * 2), M, y, reg, 12) - 10;

  // Cierre
  y = drawLines(
    page,
    wrap(
      "Esto es un punto de partida. El sistema real lo diseño después de entender cómo funciona tu negocio por dentro: primero escucho a quien lo va a usar todos los días, después construyo.",
      reg,
      11,
      W - M * 2,
    ),
    M,
    y - 4,
    reg,
    11,
  );

  // Pie de contacto
  page.drawRectangle({ x: 0, y: 0, width: W, height: 92, color: C.oscuro });
  page.drawText("¿Lo charlamos? Mandame un audio contándome cómo lo resolvés hoy.", {
    x: M,
    y: 60,
    size: 12,
    font: tituloRegular,
    color: C.blanco,
  });
  page.drawText(safe(`WhatsApp: +54 9 351 791-8029   ·   ${CONTACT_EMAIL}   ·   ailensampo.com`), {
    x: M,
    y: 40,
    size: 10,
    font: reg,
    color: C.lila,
  });
  page.drawText("Ailén Sampó · Arquitecta de sistemas digitales a medida · Córdoba, Argentina", {
    x: M,
    y: 22,
    size: 8,
    font: reg,
    color: C.lila,
    opacity: 0.7,
  });

  return pdf.save();
}
