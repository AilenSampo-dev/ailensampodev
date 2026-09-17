import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const erpRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(readFileSync(resolve(erpRoot, "seed/stockin-lavanda-backup.json"), "utf8"));
const clientes = JSON.stringify(data.clientes);
const proyectos = JSON.stringify(data.proyectos);

const sql = `-- Restaurar Stockin Lavanda en erp_backup (Supabase → SQL Editor → Run)
INSERT INTO public.erp_backup (id, clientes, proyectos, data_version, updated_at)
VALUES (
  'main',
  $c$${clientes}$c$::jsonb,
  $p$${proyectos}$p$::jsonb,
  2,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  clientes = EXCLUDED.clientes,
  proyectos = EXCLUDED.proyectos,
  data_version = EXCLUDED.data_version,
  updated_at = now();
`;

writeFileSync(resolve(erpRoot, "supabase/restaurar-stockin.sql"), sql, "utf8");
console.log("written supabase/restaurar-stockin.sql");
