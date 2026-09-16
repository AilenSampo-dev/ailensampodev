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

const { loadErpData } = await import(pathToFileURL(resolve(erpRoot, "server/supabase-erp.js")).href);
const data = await loadErpData();
console.log(JSON.stringify({
  clientes: data?.clientes?.length ?? 0,
  proyectos: data?.proyectos?.length ?? 0,
  negocios: (data?.clientes || []).map((c) => c.negocio),
  proyectosNombres: (data?.proyectos || []).map((p) => p.nombre),
  updatedAt: data?.updatedAt,
}, null, 2));
