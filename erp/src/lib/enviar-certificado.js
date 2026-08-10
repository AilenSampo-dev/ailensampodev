export function emailCliente(cliente) {
  const e = cliente.email?.trim();
  if (e?.includes("@")) return e;
  const c = cliente.contacto?.trim();
  if (c?.includes("@")) return c;
  return "";
}

export async function enviarCertificadoPorEmail({ to, pdfBase64, filename, cliente, proyecto, typedName }) {
  const res = await fetch("/api/certificado/enviar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, pdfBase64, filename, cliente, proyecto, typedName }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error || "No se pudo enviar el email.");
  return j;
}
