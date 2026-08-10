import crypto from "crypto";
import { loadErpData, saveErpData, isCloudBackupEnabled } from "./supabase-erp.js";
import { calcularHuella, validarNombreEscrito } from "../src/lib/huella-browser.js";
import { generarPdfCertificado, nombreArchivoPdf } from "../src/lib/contrato-pdf.js";
import { bytesToBase64 } from "../src/lib/pdf-utils.js";
import { enviarCertificadoBrevo } from "./enviar-certificado-brevo.js";
import { enviarEnlaceFirmaBrevo } from "./enviar-enlace-firma-brevo.js";

export function publicAppUrl(env = process.env) {
  if (env.APP_URL?.trim()) return env.APP_URL.replace(/\/$/, "");
  if (env.VERCEL_URL?.trim()) return `https://${env.VERCEL_URL.replace(/\/$/, "")}`;
  return "http://localhost:5173";
}

export function firmaUrl(token, env = process.env) {
  return `${publicAppUrl(env)}/firmar/${token}`;
}

function findByToken(data, token) {
  const proyecto = (data.proyectos || []).find((p) => p.contratoFirmaToken === token);
  if (!proyecto) return null;
  const cliente = (data.clientes || []).find((c) => c.id === proyecto.clienteId);
  return { proyecto, cliente };
}

function emailCliente(cliente) {
  const e = cliente?.email?.trim();
  if (e?.includes("@")) return e;
  const c = cliente?.contacto?.trim();
  if (c?.includes("@")) return c;
  return "";
}

export async function enviarContratoAlCliente({ proyectoId, contratoHtml }, env = process.env) {
  if (!isCloudBackupEnabled(env)) {
    const err = new Error("Configurá Supabase para enviar contratos con enlace al cliente.");
    err.status = 503;
    throw err;
  }

  const data = await loadErpData(env);
  const proyecto = data.proyectos.find((p) => p.id === proyectoId);
  if (!proyecto) {
    const err = new Error("Proyecto no encontrado.");
    err.status = 404;
    throw err;
  }
  if (proyecto.contratoEstado === "aceptado") {
    const err = new Error("Este contrato ya fue aceptado.");
    err.status = 400;
    throw err;
  }

  const cliente = data.clientes.find((c) => c.id === proyecto.clienteId);
  const to = emailCliente(cliente);
  if (!to) {
    const err = new Error("El cliente no tiene email cargado.");
    err.status = 400;
    throw err;
  }

  const token = proyecto.contratoFirmaToken || crypto.randomUUID();
  const idx = data.proyectos.findIndex((p) => p.id === proyectoId);
  data.proyectos[idx] = {
    ...proyecto,
    contratoHtml: contratoHtml || proyecto.contratoHtml,
    contratoFirmaToken: token,
    contratoEstado: "enviado",
    contratoEnviadoAt: new Date().toISOString(),
    contratoEnviadoA: to,
  };

  await saveErpData(data, env);

  const url = firmaUrl(token, env);
  await enviarEnlaceFirmaBrevo(
    {
      to,
      url,
      cliente: cliente.negocio,
      proyecto: proyecto.nombre,
      representante: cliente.representante?.trim() || "",
    },
    env
  );

  return { ok: true, to, token, url };
}

export async function obtenerContratoPublico(token, env = process.env) {
  if (!isCloudBackupEnabled(env)) {
    const err = new Error("Servicio no disponible.");
    err.status = 503;
    throw err;
  }

  const data = await loadErpData(env);
  const found = findByToken(data, token);
  if (!found) {
    const err = new Error("Enlace inválido o expirado.");
    err.status = 404;
    throw err;
  }

  const { proyecto, cliente } = found;
  const firmado = proyecto.contratoEstado === "aceptado";

  return {
    firmado,
    negocio: cliente?.negocio || "—",
    representante: cliente?.representante?.trim() || "",
    proyecto: proyecto.nombre,
    html: proyecto.contratoHtml || "",
    fechaAceptacion: proyecto.contratoAceptacion?.fecha || null,
  };
}

function clientIp(req) {
  const xf = req.headers?.["x-forwarded-for"] || req.headers?.["X-Forwarded-For"];
  if (xf) return String(xf).split(",")[0].trim();
  return req.headers?.["x-real-ip"] || req.socket?.remoteAddress || "—";
}

export async function aceptarContratoPublico(body, req, env = process.env) {
  const token = String(body.token || "").trim();
  const typedName = String(body.typedName || "").trim();
  if (!token || !typedName || !body.termsAccepted) {
    const err = new Error("Completá nombre y aceptación de términos.");
    err.status = 400;
    throw err;
  }

  const data = await loadErpData(env);
  const found = findByToken(data, token);
  if (!found) {
    const err = new Error("Enlace inválido o expirado.");
    err.status = 404;
    throw err;
  }

  const { proyecto, cliente } = found;
  if (proyecto.contratoEstado === "aceptado") {
    const err = new Error("Este contrato ya fue aceptado.");
    err.status = 400;
    throw err;
  }

  const html = proyecto.contratoHtml || "";
  if (!html.trim()) {
    const err = new Error("Contrato no disponible.");
    err.status = 400;
    throw err;
  }

  const nombreRef = cliente?.representante?.trim() || "";
  const nameError = nombreRef
    ? validarNombreEscrito(typedName, nombreRef)
    : typedName.length < 3
      ? "Escribí tu nombre completo."
      : null;
  if (nameError) {
    const err = new Error(nameError);
    err.status = 400;
    throw err;
  }

  const email = emailCliente(cliente);
  const acceptedAt = new Date();
  const contentHash = await calcularHuella(html);
  const ipAddress = clientIp(req);

  const registro = {
    id: crypto.randomUUID(),
    subjectId: proyecto.id,
    clientEmail: email || "—",
    typedName,
    termsAccepted: true,
    ipAddress,
    userAgent: String(body.userAgent || req.headers?.["user-agent"] || "").slice(0, 512),
    contentHash,
    documentHtml: html,
    acceptedAt,
    subject: {
      title: proyecto.nombre,
      category: proyecto.tipo,
      value: Number(cliente?.feeMensual) || 1500,
      valueCurrency: "USD",
    },
    client: {
      name: typedName,
      email: email || "—",
      company: cliente?.negocio || "—",
    },
  };

  const pdfNombre = nombreArchivoPdf(proyecto.nombre, "contrato-aceptado");
  let pdfBase64 = null;
  let pdfErrorMsg = null;
  let emailEnviadoAt = null;
  let emailEnviadoA = null;
  let emailError = null;

  try {
    const pdfBytes = await generarPdfCertificado(registro);
    pdfBase64 = bytesToBase64(pdfBytes);
  } catch (e) {
    pdfErrorMsg = e.message || "No se pudo generar el PDF.";
  }

  if (pdfBase64 && email) {
    try {
      await enviarCertificadoBrevo(
        {
          to: email,
          pdfBase64,
          filename: pdfNombre,
          cliente: cliente?.negocio,
          proyecto: proyecto.nombre,
          typedName,
        },
        env
      );
      emailEnviadoAt = new Date().toISOString();
      emailEnviadoA = email;
    } catch (e) {
      emailError = e.message;
    }
  } else if (!email) {
    emailError = "Sin email de cliente para enviar certificado.";
  } else if (pdfErrorMsg) {
    emailError = pdfErrorMsg;
  }

  const cert = {
    typedName: registro.typedName,
    clientEmail: registro.clientEmail,
    ipAddress: registro.ipAddress,
    contentHash: registro.contentHash,
    userAgent: registro.userAgent,
    contratoHtmlAceptado: html,
    fecha: acceptedAt.toLocaleString("es-AR", { dateStyle: "long", timeStyle: "medium" }),
    registro: { ...registro, documentHtml: undefined, acceptedAt: acceptedAt.toISOString() },
    pdfBase64,
    pdfNombre: pdfBase64 ? pdfNombre : null,
    pdfError: pdfErrorMsg,
    emailEnviadoAt,
    emailEnviadoA,
    emailError,
  };

  const idx = data.proyectos.findIndex((p) => p.id === proyecto.id);
  data.proyectos[idx] = {
    ...proyecto,
    contratoEstado: "aceptado",
    contratoAceptacion: cert,
  };

  await saveErpData(data, env);

  return {
    ok: true,
    emailEnviado: !!emailEnviadoAt,
    emailError,
    fecha: cert.fecha,
  };
}
