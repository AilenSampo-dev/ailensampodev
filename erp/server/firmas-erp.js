import { calcularHuella } from "../src/lib/huella-browser.js";

const CONTRATO_DOC_ID = "";

function firmaKey(proyectoId, tipo, documentoId = "") {
  return `${proyectoId}:${tipo}:${documentoId || ""}`;
}

/** Extrae registros de huella desde proyectos (contratos + addendums aceptados). */
export function extractFirmasFromProyectos(proyectos) {
  const firmas = [];
  for (const p of proyectos || []) {
    const cert = p.contratoAceptacion;
    const hash = cert?.contentHash || cert?.registro?.contentHash;
    if (hash) {
      firmas.push({
        proyecto_id: p.id,
        cliente_id: p.clienteId || null,
        tipo: "contrato",
        documento_id: CONTRATO_DOC_ID,
        content_hash: hash,
        typed_name: cert.typedName || cert.registro?.typedName || null,
        client_email: cert.clientEmail || cert.registro?.clientEmail || null,
        accepted_at: cert.registro?.acceptedAt || null,
        ip_address: cert.ipAddress || cert.registro?.ipAddress || null,
        user_agent: cert.userAgent || cert.registro?.userAgent || null,
      });
    }

    for (const ad of p.addendums || []) {
      if (ad.estado !== "aceptado") continue;
      const adHash = ad.aceptacion?.contentHash;
      if (!adHash) continue;
      firmas.push({
        proyecto_id: p.id,
        cliente_id: p.clienteId || null,
        tipo: "addendum",
        documento_id: ad.id,
        content_hash: adHash,
        typed_name: ad.aceptacion?.typedName || null,
        client_email: ad.aceptacion?.clientEmail || null,
        accepted_at: ad.aceptacion?.acceptedAt || null,
        ip_address: ad.aceptacion?.ipAddress || null,
        user_agent: ad.aceptacion?.userAgent || null,
      });
    }
  }
  return firmas;
}

function applyContratoFirma(cert, firma) {
  if (!cert || !firma?.content_hash) return cert;
  const registro = cert.registro
    ? { ...cert.registro, contentHash: firma.content_hash }
    : cert.registro;
  return {
    ...cert,
    contentHash: firma.content_hash,
    typedName: cert.typedName || firma.typed_name,
    clientEmail: cert.clientEmail || firma.client_email,
    ipAddress: cert.ipAddress || firma.ip_address,
    userAgent: cert.userAgent || firma.user_agent,
    registro,
  };
}

async function repairContratoHash(cert) {
  if (!cert || cert.contentHash || cert.registro?.contentHash) return cert;
  const html = cert.contratoHtmlAceptado || cert.registro?.documentHtml;
  if (!html?.trim()) return cert;

  const contentHash = await calcularHuella(html);
  const registro = cert.registro
    ? { ...cert.registro, contentHash }
    : { contentHash };
  return { ...cert, contentHash, registro };
}

async function repairAddendumHash(ad) {
  if (ad.estado !== "aceptado" || ad.aceptacion?.contentHash) return ad;
  const html = ad.html || ad.aceptacion?.documentHtml;
  if (!html?.trim()) return ad;

  const contentHash = await calcularHuella(html);
  return {
    ...ad,
    aceptacion: { ...ad.aceptacion, contentHash },
  };
}

/** Restaura huellas faltantes desde erp_firmas y recalcula desde HTML si hace falta. */
export async function enrichProyectosConFirmas(proyectos, firmasRows = []) {
  const byKey = new Map(
    (firmasRows || []).map((f) => [
      firmaKey(f.proyecto_id, f.tipo, f.documento_id),
      f,
    ])
  );

  const enriched = [];
  for (const p of proyectos || []) {
    let next = { ...p };

    if (next.contratoAceptacion) {
      const firma = byKey.get(firmaKey(p.id, "contrato", CONTRATO_DOC_ID));
      next.contratoAceptacion = applyContratoFirma(next.contratoAceptacion, firma);
      next.contratoAceptacion = await repairContratoHash(next.contratoAceptacion);
    }

    if (next.addendums?.length) {
      const addendums = [];
      for (const ad of next.addendums) {
        let nextAd = { ...ad };
        if (nextAd.estado === "aceptado") {
          const firma = byKey.get(firmaKey(p.id, "addendum", ad.id));
          if (firma?.content_hash && !nextAd.aceptacion?.contentHash) {
            nextAd = {
              ...nextAd,
              aceptacion: {
                ...nextAd.aceptacion,
                contentHash: firma.content_hash,
                typedName: nextAd.aceptacion?.typedName || firma.typed_name,
                clientEmail: nextAd.aceptacion?.clientEmail || firma.client_email,
                ipAddress: nextAd.aceptacion?.ipAddress || firma.ip_address,
                userAgent: nextAd.aceptacion?.userAgent || firma.user_agent,
              },
            };
          }
          nextAd = await repairAddendumHash(nextAd);
        }
        addendums.push(nextAd);
      }
      next.addendums = addendums;
    }

    enriched.push(next);
  }

  return enriched;
}

export async function loadFirmasForProyectos(proyectoIds, { cfg, headers, supabaseFetch }) {
  if (!cfg || !proyectoIds?.length) return [];

  const ids = [...new Set(proyectoIds.filter(Boolean))];
  const filter = ids.map((id) => encodeURIComponent(id)).join(",");
  const res = await supabaseFetch(
    `${cfg.url}/rest/v1/erp_firmas?proyecto_id=in.(${filter})&select=proyecto_id,cliente_id,tipo,documento_id,content_hash,typed_name,client_email,accepted_at,ip_address,user_agent`,
    { headers: headers(cfg.key) },
    "firmas"
  );

  if (!res.ok) {
    const err = await res.text();
    if (err.includes("erp_firmas") && (err.includes("does not exist") || err.includes("PGRST205"))) {
      return [];
    }
    throw new Error(`Supabase firmas: ${err.slice(0, 240)}`);
  }

  return res.json();
}

export async function syncFirmasFromProyectos(proyectos, { cfg, headers, supabaseFetch }) {
  if (!cfg) return;

  const firmas = extractFirmasFromProyectos(proyectos);
  if (!firmas.length) return;

  const now = new Date().toISOString();
  const rows = firmas.map((f) => ({
    ...f,
    documento_id: f.documento_id || CONTRATO_DOC_ID,
    updated_at: now,
  }));

  const res = await supabaseFetch(
    `${cfg.url}/rest/v1/erp_firmas?on_conflict=proyecto_id,tipo,documento_id`,
    {
      method: "POST",
      headers: {
        ...headers(cfg.key),
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(rows),
    },
    "firmas"
  );

  if (!res.ok) {
    const err = await res.text();
    if (err.includes("erp_firmas") && (err.includes("does not exist") || err.includes("PGRST205"))) {
      return;
    }
    throw new Error(`Supabase firmas sync: ${err.slice(0, 240)}`);
  }
}
