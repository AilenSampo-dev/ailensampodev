import { getToken } from "./erp-api.js";

export async function enviarContratoAlCliente(proyectoId, contratoHtml) {
  const token = getToken();
  const res = await fetch("/api/contrato/enviar", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ proyectoId, contratoHtml }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "No se pudo enviar el contrato.");
  return data;
}

export async function cargarContratoPublico(firmaToken) {
  const res = await fetch(`/api/contrato/publico?token=${encodeURIComponent(firmaToken)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Enlace no válido.");
  return data;
}

export async function firmarContratoPublico({ token, typedName, termsAccepted }) {
  const res = await fetch("/api/contrato/publico", {
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
  if (!res.ok) throw new Error(data.error || "No se pudo registrar la firma.");
  return data;
}
