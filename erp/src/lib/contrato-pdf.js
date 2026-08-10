import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/** Solo caracteres seguros para Helvetica / WinAnsi en pdf-lib */
function pdfSafe(text) {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const FRAME = 28;
const INNER_MARGIN = 56;
const INNER_WIDTH = PAGE_WIDTH - INNER_MARGIN * 2;

/** Colores s(a) — ERP / ailensampo.com */
const C = {
  pink: rgb(0.965, 0.337, 0.749),
  plum: rgb(0.227, 0.118, 0.4),
  ink: rgb(0.102, 0.055, 0.2),
  muted: rgb(0.52, 0.5, 0.58),
  line: rgb(0.88, 0.86, 0.92),
  white: rgb(1, 1, 1),
};

function wrapText(text, maxWidth, font, size) {
  const words = pdfSafe(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function slugServicio(text) {
  return pdfSafe(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function drawCentered(page, text, y, font, size, color) {
  const t = pdfSafe(text);
  const w = font.widthOfTextAtSize(t, size);
  page.drawText(t, { x: (PAGE_WIDTH - w) / 2, y, size, font, color });
}

function drawLogo(ctx, y) {
  const sSize = 34;
  const aSize = 22;
  const sW = ctx.bold.widthOfTextAtSize("s", sSize);
  const aW = ctx.bold.widthOfTextAtSize("(a)", aSize);
  const total = sW + aW + 2;
  let x = (PAGE_WIDTH - total) / 2;

  ctx.page.drawText("s", { x, y, size: sSize, font: ctx.bold, color: C.plum });
  x += sW + 2;
  ctx.page.drawText("(a)", { x, y: y + 2, size: aSize, font: ctx.bold, color: C.pink });
}

function drawPageFrame(page) {
  page.drawRectangle({
    x: FRAME,
    y: FRAME,
    width: PAGE_WIDTH - FRAME * 2,
    height: PAGE_HEIGHT - FRAME * 2,
    borderColor: C.pink,
    borderWidth: 1.5,
  });
}

function drawKvBlock(ctx, label, value) {
  const labelLine = `${pdfSafe(label)}:`;
  ctx.page.drawText(labelLine, {
    x: INNER_MARGIN,
    y: ctx.y,
    size: 10,
    font: ctx.bold,
    color: C.ink,
  });
  ctx.y -= 15;

  for (const line of wrapText(value || "—", INNER_WIDTH, ctx.regular, 10)) {
    ctx.page.drawText(line, {
      x: INNER_MARGIN,
      y: ctx.y,
      size: 10,
      font: ctx.regular,
      color: C.muted,
    });
    ctx.y -= 13;
  }
  ctx.y -= 10;
}

function drawHashBox(ctx, hash) {
  const h = pdfSafe(hash).replace(/\s/g, "");
  const hashLines = wrapText(h, INNER_WIDTH - 28, ctx.regular, 8.5);
  const boxH = 36 + hashLines.length * 12;
  const boxBottom = ctx.y - boxH;

  ctx.page.drawRectangle({
    x: INNER_MARGIN,
    y: boxBottom,
    width: INNER_WIDTH,
    height: boxH,
    borderColor: C.pink,
    borderWidth: 1.5,
    color: C.white,
  });

  ctx.page.drawText("HUELLA DIGITAL SHA-256", {
    x: INNER_MARGIN + 14,
    y: ctx.y - 18,
    size: 9,
    font: ctx.bold,
    color: C.pink,
  });

  let hy = ctx.y - 34;
  for (const line of hashLines) {
    ctx.page.drawText(line, {
      x: INNER_MARGIN + 14,
      y: hy,
      size: 8.5,
      font: ctx.regular,
      color: C.ink,
    });
    hy -= 12;
  }

  ctx.y = boxBottom - 20;
}

function formatFechaAceptacion(date, locale, timeZone) {
  return (
    date.toLocaleString(locale, {
      dateStyle: "long",
      timeStyle: "medium",
      timeZone,
    }) + " (ART)"
  );
}

export async function generarPdfCertificado(registro, opciones = {}) {
  const reg = {
    ...registro,
    acceptedAt: registro.acceptedAt instanceof Date ? registro.acceptedAt : new Date(registro.acceptedAt),
  };
  if (Number.isNaN(reg.acceptedAt.getTime())) {
    reg.acceptedAt = new Date();
  }

  const opts = {
    timeZone: "America/Argentina/Buenos_Aires",
    locale: "es-AR",
    avisoLegal:
      "La persona identificada confirmo haber leido y aceptado el contrato mediante consentimiento " +
      "explicito, con registro de fecha, hora e identificadores tecnicos.",
    etiquetaValor: "Inversion mensual",
    ...opciones,
  };

  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  drawPageFrame(page);

  const fechaLocal = formatFechaAceptacion(reg.acceptedAt, opts.locale, opts.timeZone);

  const ctx = { doc, page, regular, bold, y: PAGE_HEIGHT - FRAME - 52 };

  drawLogo(ctx, ctx.y);
  ctx.y -= 52;

  drawCentered(page, "Certificado de aceptacion", ctx.y, bold, 20, C.plum);
  ctx.y -= 26;
  drawCentered(page, "Registro electronico del contrato", ctx.y, regular, 11, C.muted);
  ctx.y -= 22;

  page.drawLine({
    start: { x: INNER_MARGIN, y: ctx.y },
    end: { x: PAGE_WIDTH - INNER_MARGIN, y: ctx.y },
    thickness: 0.75,
    color: C.line,
  });
  ctx.y -= 28;

  const clienteLabel = reg.client.company
    ? `${reg.client.company}${reg.client.name && reg.client.name !== reg.client.company ? ` · ${reg.client.name}` : ""}`
    : reg.client.name || "—";

  drawKvBlock(ctx, "Proyecto", reg.subject.title);
  drawKvBlock(ctx, "Cliente", clienteLabel);
  drawKvBlock(ctx, "Email", reg.clientEmail);
  drawKvBlock(ctx, "Nombre declarado", reg.typedName);
  drawKvBlock(ctx, "Fecha", fechaLocal);
  drawKvBlock(ctx, "Servicio", slugServicio(reg.subject.title) || reg.subject.category || "—");

  const moneda = reg.subject.valueCurrency ?? "USD";
  const monto = Number(reg.subject.value) > 0 ? Number(reg.subject.value) : 1500;
  drawKvBlock(ctx, opts.etiquetaValor, `${moneda} ${monto.toLocaleString("en-US")}`);

  drawKvBlock(ctx, "Direccion IP", reg.ipAddress || "no registrada");
  drawKvBlock(ctx, "Navegador", reg.userAgent || "no registrado");

  ctx.y -= 4;
  for (const line of wrapText(opts.avisoLegal, INNER_WIDTH, regular, 9.5)) {
    page.drawText(line, {
      x: INNER_MARGIN,
      y: ctx.y,
      size: 9.5,
      font: regular,
      color: C.muted,
    });
    ctx.y -= 13;
  }

  ctx.y -= 12;
  drawHashBox(ctx, reg.contentHash);

  drawCentered(page, "s(a) · Ailen Sampo · Sistemas a medida · www.ailensampo.com", FRAME + 18, regular, 8, C.muted);

  return doc.save();
}

export function nombreArchivoPdf(titulo, prefijo = "contrato-aceptado") {
  const safe = titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${prefijo}-${safe || "documento"}.pdf`;
}
