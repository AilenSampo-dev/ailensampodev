import crypto from "crypto";
import { loadErpData, saveErpData, isCloudBackupEnabled } from "./supabase-erp.js";
import { validarNombreEscrito } from "../src/lib/huella-browser.js";
import { enviarEnlaceAddendumBrevo } from "./enviar-enlace-addendum-brevo.js";
import { publicAppUrl } from "./contrato-publico.js";

function emailCliente(cliente) {
  const e = cliente?.email?.trim();
  if (e?.includes("@")) return e;
  const c = cliente?.contacto?.trim();
  if (c?.includes("@")) return c;
  return "";
}

export function addendumUrl(token, env = process.env) {
  return `${publicAppUrl(env)}/addendum/${token}`;
}

function findAddendumByToken(data, token) {
  for (const proyecto of data.proyectos || []) {
    const addendum = (proyecto.addendums || []).find((a) => a.firmaToken === token);
    if (addendum) {
      const cliente = data.clientes.find((c) => c.id === proyecto.clienteId);
      return { proyecto, cliente, addendum };
    }
  }
  return null;
}

function updateAddendumInData(data, proyectoId, addendumId, patch) {
  const pIdx = data.proyectos.findIndex((p) => p.id === proyectoId);
  if (pIdx < 0) return null;
  const proyecto = data.proyectos[pIdx];
  const aIdx = (proyecto.addendums || []).findIndex((a) => a.id === addendumId);
  if (aIdx < 0) return null;
  const nextAddendums = [...(proyecto.addendums || [])];
  nextAddendums[aIdx] = { ...nextAddendums[aIdx], ...patch };
  data.proyectos[pIdx] = { ...proyecto, addendums: nextAddendums };
  return nextAddendums[aIdx];
}

export async function enviarAddendumAlCliente({ proyectoId, addendumId, html }, env = process.env) {
  if (!isCloudBackupEnabled(env)) {
    const err = new Error("Configurá Supabase para enviar addendums con enlace al cliente.");
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

  const addendum = (proyecto.addendums || []).find((a) => a.id === addendumId);
  if (!addendum) {
    const err = new Error("Addendum no encontrado.");
    err.status = 404;
    throw err;
  }
  if (addendum.estado === "aceptado") {
    const err = new Error("Este addendum ya fue aceptado.");
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

  const token = addendum.firmaToken || crypto.randomUUID();
  updateAddendumInData(data, proyectoId, addendumId, {
    html: html || addendum.html,
    firmaToken: token,
    estado: "enviado",
    enviadoAt: new Date().toISOString(),
    enviadoA: to,
  });

  await saveErpData(data, env);

  const url = addendumUrl(token, env);
  await enviarEnlaceAddendumBrevo(
    {
      to,
      url,
      cliente: cliente.negocio,
      titulo: addendum.titulo || "Addendum",
      representante: cliente.representante?.trim() || "",
    },
    env
  );

  return { ok: true, to, token, url };
}

export async function obtenerAddendumPublico(token, env = process.env) {
  if (!isCloudBackupEnabled(env)) {
    const err = new Error("Servicio no disponible.");
    err.status = 503;
    throw err;
  }

  const data = await loadErpData(env);
  const found = findAddendumByToken(data, token);
  if (!found) {
    const err = new Error("Enlace inválido o expirado.");
    err.status = 404;
    throw err;
  }

  const { proyecto, cliente, addendum } = found;

  return {
    firmado: addendum.estado === "aceptado",
    negocio: cliente?.negocio || "—",
    representante: cliente?.representante?.trim() || "",
    proyecto: proyecto.nombre,
    titulo: addendum.titulo || "Addendum",
    html: addendum.html || "",
    fechaAceptacion: addendum.aceptacion?.fecha || null,
    metodoAceptacion: addendum.aceptacion?.metodo || null,
  };
}

function clientIp(req) {
  const xf = req.headers?.["x-forwarded-for"] || req.headers?.["X-Forwarded-For"];
  if (xf) return String(xf).split(",")[0].trim();
  return req.headers?.["x-real-ip"] || req.socket?.remoteAddress || "—";
}

export async function aceptarAddendumPublico(body, req, env = process.env) {
  const token = String(body.token || "").trim();
  const typedName = String(body.typedName || "").trim();
  if (!token || !typedName || !body.termsAccepted) {
    const err = new Error("Completá nombre y confirmación.");
    err.status = 400;
    throw err;
  }

  const data = await loadErpData(env);
  const found = findAddendumByToken(data, token);
  if (!found) {
    const err = new Error("Enlace inválido o expirado.");
    err.status = 404;
    throw err;
  }

  const { proyecto, cliente, addendum } = found;
  if (addendum.estado === "aceptado") {
    const err = new Error("Este addendum ya fue aceptado.");
    err.status = 400;
    throw err;
  }

  const html = addendum.html || "";
  if (!html.trim()) {
    const err = new Error("Documento no disponible.");
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

  const acceptedAt = new Date();
  const aceptacion = {
    typedName,
    clientEmail: emailCliente(cliente) || "—",
    ipAddress: clientIp(req),
    userAgent: String(body.userAgent || req.headers?.["user-agent"] || "").slice(0, 512),
    metodo: "web",
    fecha: acceptedAt.toLocaleString("es-AR", { dateStyle: "long", timeStyle: "medium" }),
    nota: null,
  };

  updateAddendumInData(data, proyecto.id, addendum.id, {
    estado: "aceptado",
    aceptacion,
  });

  await saveErpData(data, env);

  return { ok: true, fecha: aceptacion.fecha };
}
