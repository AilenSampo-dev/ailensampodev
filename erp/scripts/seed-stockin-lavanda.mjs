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

const { mergeStockinSeed } = await import(pathToFileURL(resolve(erpRoot, "src/lib/stockin-lavanda-seed.js")).href);
const { loadErpData, saveErpData } = await import(pathToFileURL(resolve(erpRoot, "server/supabase-erp.js")).href);

const current = (await loadErpData()) ?? { clientes: [], proyectos: [], dataVersion: 2 };
const merged = mergeStockinSeed(current.clientes, current.proyectos);

await saveErpData({
  clientes: merged.clientes,
  proyectos: merged.proyectos,
  dataVersion: current.dataVersion ?? 2,
});

console.log("Stockin Lavanda subido a Supabase.");
console.log(`Clientes: ${merged.clientes.length}, Proyectos: ${merged.proyectos.length}`);
