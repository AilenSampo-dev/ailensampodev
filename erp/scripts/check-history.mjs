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

const { listBackupHistory } = await import(pathToFileURL(resolve(erpRoot, "server/supabase-erp.js")).href);

try {
  const items = await listBackupHistory(5);
  console.log("OK:", items.length, "snapshots");
} catch (e) {
  console.log("ERROR:", e.message);
}
