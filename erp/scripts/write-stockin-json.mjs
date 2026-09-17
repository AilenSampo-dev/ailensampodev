import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const erpRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { buildStockinLavandaData } = await import(
  pathToFileURL(resolve(erpRoot, "src/lib/stockin-lavanda-seed.js")).href
);

const data = buildStockinLavandaData();
writeFileSync(
  resolve(erpRoot, "seed/stockin-lavanda-backup.json"),
  JSON.stringify({ clientes: data.clientes, proyectos: data.proyectos }, null, 2),
  "utf8"
);
console.log("written", data.clientes.length, "clientes");
