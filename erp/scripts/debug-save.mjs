import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const erpRoot = resolve(__dirname, "..");
const envPath = resolve(erpRoot, ".env");

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const { mergeStockinSeed } = await import(pathToFileURL(resolve(erpRoot, "src/lib/stockin-lavanda-seed.js")).href);
const { sanitizeErpPayload, normalizeSupabaseUrl } = await import(pathToFileURL(resolve(erpRoot, "server/supabase-erp.js")).href);

const url = normalizeSupabaseUrl(process.env.SUPABASE_URL);
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const merged = mergeStockinSeed([], []);
const sanitized = sanitizeErpPayload(merged);
const body = {
  id: "main",
  clientes: sanitized.clientes,
  proyectos: sanitized.proyectos,
  data_version: 2,
  updated_at: new Date().toISOString(),
};

const payload = JSON.stringify(body);
console.log("payload bytes:", payload.length);
console.log("clientes:", sanitized.clientes.length, "proyectos:", sanitized.proyectos.length);

const res = await fetch(`${url}/rest/v1/erp_backup?on_conflict=id`, {
  method: "POST",
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "resolution=merge-duplicates,return=representation",
  },
  body: payload,
});

console.log("status:", res.status);
const text = await res.text();
console.log("response:", text.slice(0, 500));

const read = await fetch(`${url}/rest/v1/erp_backup?id=eq.main&select=clientes,proyectos,updated_at`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
});
const row = await read.json();
console.log("read back clientes:", row[0]?.clientes?.length, "proyectos:", row[0]?.proyectos?.length);
