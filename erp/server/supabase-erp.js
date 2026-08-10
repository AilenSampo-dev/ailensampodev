const ROW_ID = "main";

function supabaseConfig(env = process.env) {
  const url = (env.SUPABASE_URL || "").replace(/\/$/, "");
  const key = env.SUPABASE_SERVICE_ROLE_KEY || "";
  return url && key ? { url, key } : null;
}

function headers(key) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

/** Omite PDF base64 del backup (se regenera al descargar). */
export function sanitizeProyectos(proyectos) {
  return (proyectos || []).map((p) => {
    if (!p.contratoAceptacion?.pdfBase64) return p;
    const { pdfBase64, ...cert } = p.contratoAceptacion;
    return { ...p, contratoAceptacion: cert };
  });
}

export function isCloudBackupEnabled(env = process.env) {
  return !!supabaseConfig(env);
}

export async function loadErpData(env = process.env) {
  const cfg = supabaseConfig(env);
  if (!cfg) return null;

  const res = await fetch(`${cfg.url}/rest/v1/erp_backup?id=eq.${ROW_ID}&select=clientes,proyectos,data_version,updated_at`, {
    headers: headers(cfg.key),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase lectura: ${err.slice(0, 200)}`);
  }

  const rows = await res.json();
  if (!rows.length) {
    return { clientes: [], proyectos: [], dataVersion: 2, updatedAt: null };
  }

  const row = rows[0];
  return {
    clientes: row.clientes ?? [],
    proyectos: row.proyectos ?? [],
    dataVersion: row.data_version ?? 2,
    updatedAt: row.updated_at ?? null,
  };
}

export async function saveErpData({ clientes, proyectos, dataVersion = 2 }, env = process.env) {
  const cfg = supabaseConfig(env);
  if (!cfg) return null;

  const body = {
    id: ROW_ID,
    clientes: clientes ?? [],
    proyectos: sanitizeProyectos(proyectos),
    data_version: dataVersion,
    updated_at: new Date().toISOString(),
  };

  const res = await fetch(`${cfg.url}/rest/v1/erp_backup`, {
    method: "POST",
    headers: {
      ...headers(cfg.key),
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase guardado: ${err.slice(0, 200)}`);
  }

  const rows = await res.json();
  return rows[0]?.updated_at ?? body.updated_at;
}
