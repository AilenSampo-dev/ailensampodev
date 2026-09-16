const ROW_ID = "main";
const HISTORY_KEEP = 30;

/** Normaliza URL copiada con comillas, slash final o connection string postgres. */
export function normalizeSupabaseUrl(raw = "") {
  let url = String(raw || "").trim().replace(/^["']|["']$/g, "");
  if (/^postgres(ql)?:\/\//i.test(url)) {
    try {
      const u = new URL(url.replace(/^postgresql:/i, "postgres:"));
      const host = u.hostname || "";
      const ref = host.replace(/^db\./i, "").replace(/\.supabase\.co$/i, "");
      if (ref) url = `https://${ref}.supabase.co`;
    } catch {
      /* seguir con url original */
    }
  }
  return url.replace(/\/rest\/v1\/?$/i, "").replace(/\/$/, "");
}

export function validateSupabaseUrl(url) {
  if (!url) {
    return { ok: false, error: "SUPABASE_URL vacía en Vercel." };
  }
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) {
    return {
      ok: false,
      host: url.slice(0, 80),
      error:
        `SUPABASE_URL inválida (${url.slice(0, 50)}…). ` +
        "Usá la Project URL de Supabase → Settings → API: https://TU-REF.supabase.co",
    };
  }
  return { ok: true, host: new URL(url).hostname };
}

function supabaseConfig(env = process.env) {
  const url = normalizeSupabaseUrl(env.SUPABASE_URL);
  const key = String(env.SUPABASE_SERVICE_ROLE_KEY || "").trim().replace(/^["']|["']$/g, "");
  if (!url || !key) return null;
  const check = validateSupabaseUrl(url);
  if (!check.ok) {
    const err = new Error(check.error);
    err.code = "SUPABASE_URL_INVALID";
    err.host = check.host;
    throw err;
  }
  return { url, key, host: check.host };
}

function headers(key) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

function stripAdjuntoBase64(adj) {
  if (!adj?.base64) return adj;
  const { base64, ...rest } = adj;
  return rest;
}

/** Omite PDF base64 del backup en nube (demasiado pesado; se regenera o queda en local). */
export function sanitizeClientes(clientes) {
  return (clientes || []).map((c) => {
    if (!c.facturacion?.length) return c;
    return {
      ...c,
      facturacion: c.facturacion.map((m) => ({
        ...m,
        documentoDetalle: m.documentoDetalle
          ? { ...m.documentoDetalle, adjunto: stripAdjuntoBase64(m.documentoDetalle.adjunto) }
          : m.documentoDetalle,
        facturaFiscal: m.facturaFiscal
          ? { ...m.facturaFiscal, adjunto: stripAdjuntoBase64(m.facturaFiscal.adjunto) }
          : m.facturaFiscal,
        pago: m.pago
          ? { ...m.pago, comprobantes: (m.pago.comprobantes || []).map(stripAdjuntoBase64) }
          : m.pago,
      })),
    };
  });
}

export function sanitizeProyectos(proyectos) {
  return (proyectos || []).map((p) => {
    let next = { ...p };
    if (next.contratoAceptacion?.pdfBase64) {
      const { pdfBase64, ...cert } = next.contratoAceptacion;
      next.contratoAceptacion = cert;
    }
    return next;
  });
}

export function sanitizeErpPayload({ clientes, proyectos }) {
  return {
    clientes: sanitizeClientes(clientes),
    proyectos: sanitizeProyectos(proyectos),
  };
}

export function isCloudBackupEnabled(env = process.env) {
  try {
    return !!supabaseConfig(env);
  } catch {
    return !!normalizeSupabaseUrl(env.SUPABASE_URL) && !!String(env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  }
}

/** Diagnóstico sin exponer secretos — para /api/erp/health */
export async function probeSupabaseConnection(env = process.env) {
  const urlRaw = env.SUPABASE_URL;
  const url = normalizeSupabaseUrl(urlRaw);
  const hasKey = !!String(env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const validation = validateSupabaseUrl(url);

  const out = {
    configured: !!(url && hasKey),
    hasUrl: !!url,
    hasServiceRoleKey: hasKey,
    urlNormalized: url || null,
    host: validation.host || null,
    urlValid: validation.ok,
    urlError: validation.ok ? null : validation.error,
    tableOk: null,
    error: null,
  };

  if (!validation.ok) {
    out.error = validation.error;
    return out;
  }
  if (!hasKey) {
    out.error = "Falta SUPABASE_SERVICE_ROLE_KEY en Vercel.";
    return out;
  }

  try {
    const cfg = supabaseConfig(env);
    const res = await fetch(
      `${cfg.url}/rest/v1/erp_backup?id=eq.${ROW_ID}&select=id&limit=1`,
      { headers: headers(cfg.key) }
    );
    if (!res.ok) {
      const err = await res.text();
      out.error = parseSupabaseError(err, "health");
      out.tableOk = false;
      return out;
    }
    out.tableOk = true;
    return out;
  } catch (e) {
    out.error = e.message || String(e);
    return out;
  }
}

async function supabaseFetch(url, options, action) {
  let res;
  try {
    res = await fetch(url, options);
  } catch (e) {
    const hint = e?.cause?.code === "ENOTFOUND"
      ? " Revisá SUPABASE_URL en Vercel (Settings → Environment Variables): el proyecto no existe o la URL está mal."
      : "";
    throw new Error(`No se pudo conectar a Supabase (${action}).${hint}`);
  }
  return res;
}

function parseSupabaseError(err, action) {
  if (err.includes("erp_backup_history") && (err.includes("does not exist") || err.includes("PGRST205"))) {
    return "Falta la tabla erp_backup_history. Ejecutá erp/supabase/migration-backup-history.sql en Supabase.";
  }
  if (err.includes("erp_backup") && (err.includes("does not exist") || err.includes("PGRST205"))) {
    return "Falta la tabla erp_backup en Supabase. Ejecutá erp/supabase/schema.sql en el SQL Editor.";
  }
  if (err.includes("Payload too large") || err.includes("request entity too large")) {
    return "Los datos son demasiado grandes para Supabase. Los PDF adjuntos no se sincronizan a la nube.";
  }
  return `Supabase ${action}: ${err.slice(0, 240)}`;
}

export async function loadErpData(env = process.env) {
  let cfg;
  try {
    cfg = supabaseConfig(env);
  } catch (e) {
    throw e;
  }
  if (!cfg) return null;

  const res = await supabaseFetch(
    `${cfg.url}/rest/v1/erp_backup?id=eq.${ROW_ID}&select=clientes,proyectos,data_version,updated_at`,
    { headers: headers(cfg.key) },
    "lectura"
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(parseSupabaseError(err, "lectura"));
  }

  const rows = await res.json();
  if (!rows.length) {
    return { clientes: [], proyectos: [], dataVersion: 2, updatedAt: null };
  }

  const row = rows[0];
  const sanitized = sanitizeErpPayload({
    clientes: row.clientes ?? [],
    proyectos: row.proyectos ?? [],
  });

  const result = {
    clientes: sanitized.clientes,
    proyectos: sanitized.proyectos,
    dataVersion: row.data_version ?? 2,
    updatedAt: row.updated_at ?? null,
  };

  if (!result.clientes.length && !result.proyectos.length) {
    const { mergeStockinSeed } = await import("../src/lib/stockin-lavanda-seed.js");
    const seeded = mergeStockinSeed([], []);
    const updatedAt = await saveErpData(
      {
        clientes: seeded.clientes,
        proyectos: seeded.proyectos,
        dataVersion: result.dataVersion,
      },
      env,
      { skipSnapshot: true }
    );
    return {
      clientes: seeded.clientes,
      proyectos: seeded.proyectos,
      dataVersion: result.dataVersion,
      updatedAt: updatedAt ?? new Date().toISOString(),
      seeded: true,
    };
  }

  return result;
}

function payloadFingerprint(clientes, proyectos) {
  return JSON.stringify({ clientes: clientes ?? [], proyectos: proyectos ?? [] });
}

async function insertBackupSnapshot({ clientes, proyectos, dataVersion = 2, source = "auto" }, env) {
  const cfg = supabaseConfig(env);
  if (!cfg) return null;

  const sanitized = sanitizeErpPayload({ clientes, proyectos });
  const body = {
    clientes: sanitized.clientes,
    proyectos: sanitized.proyectos,
    data_version: dataVersion,
    source,
    clientes_count: sanitized.clientes.length,
    proyectos_count: sanitized.proyectos.length,
    created_at: new Date().toISOString(),
  };

  const res = await supabaseFetch(
    `${cfg.url}/rest/v1/erp_backup_history`,
    {
      method: "POST",
      headers: { ...headers(cfg.key), Prefer: "return=minimal" },
      body: JSON.stringify(body),
    },
    "historial"
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(parseSupabaseError(err, "historial"));
  }

  return true;
}

async function pruneBackupHistory(env, keep = HISTORY_KEEP) {
  const cfg = supabaseConfig(env);
  if (!cfg) return;

  const listRes = await supabaseFetch(
    `${cfg.url}/rest/v1/erp_backup_history?select=id&order=created_at.desc&offset=${keep}&limit=100`,
    { headers: headers(cfg.key) },
    "historial"
  );
  if (!listRes.ok) return;

  const stale = await listRes.json();
  if (!stale.length) return;

  const ids = stale.map((r) => r.id).join(",");
  await supabaseFetch(
    `${cfg.url}/rest/v1/erp_backup_history?id=in.(${ids})`,
    { method: "DELETE", headers: headers(cfg.key) },
    "historial"
  );
}

export async function listBackupHistory(limit = HISTORY_KEEP, env = process.env) {
  const cfg = supabaseConfig(env);
  if (!cfg) return [];

  const res = await supabaseFetch(
    `${cfg.url}/rest/v1/erp_backup_history?select=id,source,clientes_count,proyectos_count,created_at&order=created_at.desc&limit=${limit}`,
    { headers: headers(cfg.key) },
    "historial"
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(parseSupabaseError(err, "historial"));
  }

  return res.json();
}

export async function loadBackupSnapshot(id, env = process.env) {
  const cfg = supabaseConfig(env);
  if (!cfg) return null;

  const res = await supabaseFetch(
    `${cfg.url}/rest/v1/erp_backup_history?id=eq.${encodeURIComponent(id)}&select=id,clientes,proyectos,data_version,created_at`,
    { headers: headers(cfg.key) },
    "historial"
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(parseSupabaseError(err, "historial"));
  }

  const rows = await res.json();
  if (!rows.length) return null;

  const row = rows[0];
  const sanitized = sanitizeErpPayload({
    clientes: row.clientes ?? [],
    proyectos: row.proyectos ?? [],
  });

  return {
    id: row.id,
    clientes: sanitized.clientes,
    proyectos: sanitized.proyectos,
    dataVersion: row.data_version ?? 2,
    createdAt: row.created_at,
  };
}

export async function restoreBackupSnapshot(id, env = process.env) {
  const snapshot = await loadBackupSnapshot(id, env);
  if (!snapshot) throw new Error("Backup no encontrado.");

  const current = await loadErpData(env);
  if (current && (current.clientes?.length || current.proyectos?.length)) {
    await insertBackupSnapshot(
      {
        clientes: current.clientes,
        proyectos: current.proyectos,
        dataVersion: current.dataVersion,
        source: "pre-restore",
      },
      env
    );
  }

  const updatedAt = await saveErpData(
    {
      clientes: snapshot.clientes,
      proyectos: snapshot.proyectos,
      dataVersion: snapshot.dataVersion,
    },
    env,
    { skipSnapshot: true }
  );

  await pruneBackupHistory(env);

  return {
    clientes: snapshot.clientes,
    proyectos: snapshot.proyectos,
    dataVersion: snapshot.dataVersion,
    updatedAt,
    restoredFrom: snapshot.createdAt,
  };
}

export async function saveErpData(
  { clientes, proyectos, dataVersion = 2 },
  env = process.env,
  { skipSnapshot = false } = {}
) {
  const cfg = supabaseConfig(env);
  if (!cfg) {
    throw new Error("Supabase no configurado. Agregá SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.");
  }

  if (!skipSnapshot) {
    try {
      const current = await loadErpData(env);
      const nextFp = payloadFingerprint(clientes, proyectos);
      const curFp = payloadFingerprint(current?.clientes, current?.proyectos);
      if (current && curFp !== nextFp && (current.clientes?.length || current.proyectos?.length)) {
        await insertBackupSnapshot(
          {
            clientes: current.clientes,
            proyectos: current.proyectos,
            dataVersion: current.dataVersion,
            source: "auto",
          },
          env
        );
        await pruneBackupHistory(env);
      }
    } catch (e) {
      if (e.message?.includes("erp_backup_history")) throw e;
    }
  }

  const sanitized = sanitizeErpPayload({ clientes, proyectos });
  const body = {
    id: ROW_ID,
    clientes: sanitized.clientes ?? [],
    proyectos: sanitized.proyectos ?? [],
    data_version: dataVersion,
    updated_at: new Date().toISOString(),
  };

  const res = await supabaseFetch(
    `${cfg.url}/rest/v1/erp_backup?on_conflict=id`,
    {
      method: "POST",
      headers: {
        ...headers(cfg.key),
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify(body),
    },
    "guardado"
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(parseSupabaseError(err, "guardado"));
  }

  const rows = await res.json();
  return rows[0]?.updated_at ?? body.updated_at;
}
