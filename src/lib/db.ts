import { neon } from "@neondatabase/serverless";

// Conexión a Neon (base del sitio). Sin DATABASE_URL, devuelve null y el sitio sigue andando sin registrar.
let client: ReturnType<typeof neon> | null | undefined;

export function getSql() {
  if (client === undefined) {
    const url = process.env.DATABASE_URL?.trim().replace(/^["']|["']$/g, "");
    client = url ? neon(url) : null;
  }
  return client;
}
