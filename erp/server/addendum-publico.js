import crypto from "crypto";
import { loadErpData, saveErpData, isCloudBackupEnabled } from "./supabase-erp.js";
import { calcularHuella, validarNombreEscrito } from "../src/lib/huella-browser.js";
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

function findAddendumInProyecto(proyecto, { addendumId, addendumSnapshot }) {
  const list = proyecto.addendums || [];
  let found = list.find((a) => a.id === addendumId);
  if (!found && addendumSnapshot?.id) {
    found = list.find((a) => a.id === addendumSnapshot.id);
  }
  if (!found && addendumSnapshot?.slug) {
    found = list.find((a) => a.slug === addendumSnapshot.slug);
  }
  return found;
}

/** Inserta o actualiza el addendum desde el ERP local antes de enviar por mail. */
function upsertAddendumInData(data, proyectoId, snapshot, html) {
  const pIdx = data.proyectos.findIndex((p) => p.id === proyectoId);
  if (pIdx < 0 || !snapshot?.id) return null;

  const proyecto = data.proyectos[pIdx];
  const addendums = [...(proyecto.addendums || [])];
  const idx = addendums.findIndex(
    (a) => a.id === snapshot.id || (snapshot.slug && a.slug === snapshot.slug)
  );
  const merged = {
    ...(idx >= 0 ? addendums[idx] : {}),
    ...snapshot,
    html: html || snapshot.html || (idx >= 0 ? addendums[idx].html : ""),
  };

  if (idx >= 0) addendums[idx] = merged;
  else addendums.push(merged);

  data.proyectos[pIdx] = { ...proyecto, addendums };
  return merged;
}

export async function enviarAddendumAlCliente({ proyectoId, addendumId, html, addendum: addendumSnapshot }, env = process.env) {
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

  let addendum = findAddendumInProyecto(proyecto, { addendumId, addendumSnapshot });
  if (!addendum && addendumSnapshot) {
    addendum = upsertAddendumInData(data, proyectoId, addendumSnapshot, html);
  }
  if (!addendum) {
    const err = new Error(
      "Addendum no encontrado en Supabase. Guardá el borrador en Redactar e intentá de nuevo."
    );
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
  updateAddendumInData(data, proyectoId, addendum.id, {
    html: html || addendum.html,
    firmaToken: token,
    estado: "enviado",
    enviadoAt: new Date().toISOString(),
    enviadoA: to,
  });

  await saveErpData(data, env);

  const url = addendumUrl(token, env);
  const mail = await enviarEnlaceAddendumBrevo(
    {
      to,
      url,
      cliente: cliente.negocio,
      titulo: addendum.titulo || "Addendum",
      representante: cliente.representante?.trim() || "",
    },
    env
  );

  return { ok: true, to, token, url, copiaAdmin: mail.copiaAdmin || null };
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
  const contentHash = await calcularHuella(html);
  const aceptacion = {
    typedName,
    clientEmail: emailCliente(cliente) || "—",
    ipAddress: clientIp(req),
    userAgent: String(body.userAgent || req.headers?.["user-agent"] || "").slice(0, 512),
    contentHash,
    acceptedAt: acceptedAt.toISOString(),
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
