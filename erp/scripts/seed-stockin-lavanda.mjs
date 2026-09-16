/**
 * Sube Stockin Lavanda a Supabase (erp_backup main).
 * Uso: node scripts/seed-stockin-lavanda.mjs
 * Requiere erp/.env con SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
 */
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

if (!process.env.SUPABASE_URL?.trim() || !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
  console.error("Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en erp/.env");
  console.error("En producción: POST /api/erp/seed-stockin (logueado) o recargá el ERP (auto-seed si está vacío).");
  process.exit(1);
}

const { mergeStockinSeed } = await import(pathToFileURL(resolve(erpRoot, "src/lib/stockin-lavanda-seed.js")).href);
const { loadErpData, saveErpData, isCloudBackupEnabled } = await import(
  pathToFileURL(resolve(erpRoot, "server/supabase-erp.js")).href
);

if (!isCloudBackupEnabled()) {
  console.error("Supabase no configurado correctamente.");
  process.exit(1);
}

const current = (await loadErpData()) ?? { clientes: [], proyectos: [], dataVersion: 2 };
const merged = mergeStockinSeed(current.clientes, current.proyectos);

const updatedAt = await saveErpData({
  clientes: merged.clientes,
  proyectos: merged.proyectos,
  dataVersion: current.dataVersion ?? 2,
});

if (!updatedAt) {
  console.error("No se pudo guardar en Supabase.");
  process.exit(1);
}

console.log("Stockin Lavanda subido a Supabase.");
console.log(`Clientes: ${merged.clientes.length}, Proyectos: ${merged.proyectos.length}`);
