import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const STOCKIN_CLIENT_ID = "c-stockin-lavanda";
export const STOCKIN_PROJECT_ID = "p-stockin-erp";

const __dirname = dirname(fileURLToPath(import.meta.url));
let cachedSeed = null;

function loadSeedFile() {
  if (cachedSeed) return cachedSeed;
  const raw = readFileSync(join(__dirname, "../seed/stockin-lavanda-backup.json"), "utf8");
  cachedSeed = JSON.parse(raw);
  return cachedSeed;
}

export function buildStockinLavandaData() {
  const data = loadSeedFile();
  return { clientes: data.clientes, proyectos: data.proyectos };
}

/** Inserta o reemplaza Stockin Lavanda sin tocar otros clientes. */
export function mergeStockinSeed(clientes = [], proyectos = []) {
  const seed = buildStockinLavandaData();
  const nextClientes = (clientes || []).filter(
    (c) => c.id !== STOCKIN_CLIENT_ID && String(c.slug || "").toLowerCase() !== "stockin-lavanda"
  );
  const nextProyectos = (proyectos || []).filter(
    (p) => p.id !== STOCKIN_PROJECT_ID && p.clienteId !== STOCKIN_CLIENT_ID
  );
  return {
    clientes: [...nextClientes, ...seed.clientes],
    proyectos: [...nextProyectos, ...seed.proyectos],
  };
}
