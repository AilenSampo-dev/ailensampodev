import { getToken } from "./erp-api.js";

export async function enviarAddendumAlCliente(proyectoId, addendumId, html, addendum) {
  const token = getToken();
  const res = await fetch("/api/addendum/enviar", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ proyectoId, addendumId, html, addendum }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "No se pudo enviar el addendum.");
  return data;
}

export async function cargarAddendumPublico(firmaToken) {
  const res = await fetch(`/api/addendum/publico?token=${encodeURIComponent(firmaToken)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Enlace no válido.");
  return data;
}

export async function confirmarAddendumPublico({ token, typedName, termsAccepted }) {
  const res = await fetch("/api/addendum/publico", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token,
      typedName,
      termsAccepted,
      userAgent: navigator.userAgent.slice(0, 512),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "No se pudo registrar la confirmación.");
  return data;
}
