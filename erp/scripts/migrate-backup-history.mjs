/**
 * Crea erp_backup_history en Supabase vía SQL (requiere DATABASE_URL postgres en .env).
 * Alternativa manual: pegar erp/supabase/migration-backup-history.sql en SQL Editor.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const erpRoot = resolve(__dirname, "..");
const envPath = resolve(erpRoot, ".env");

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error("Falta DATABASE_URL en erp/.env.");
  console.error("Ejecutá manualmente erp/supabase/migration-backup-history.sql en Supabase → SQL Editor.");
  process.exit(1);
}

const sql = readFileSync(resolve(erpRoot, "supabase/migration-backup-history.sql"), "utf8");

try {
  const pg = await import("pg");
  const client = new pg.default.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  await client.query(sql);
  await client.end();
  console.log("Tabla erp_backup_history creada.");
} catch (e) {
  if (e.code === "ERR_MODULE_NOT_FOUND") {
    console.error("Instalá pg: npm install pg --prefix erp");
    process.exit(1);
  }
  throw e;
}
