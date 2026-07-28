async function notifyOpen({ ipHash, openedAt, geoCountry, geoCity }) {
  if (process.env.PROPOSAL_NOTIFY_ON_OPEN !== "true") return;

  const apiKey = process.env.BREVO_API_KEY;
  const to = process.env.PROPOSAL_NOTIFY_EMAIL;
  if (!apiKey || !to) return;

  const location = [geoCity, geoCountry].filter(Boolean).join(", ") || "ubicación desconocida";

  try {
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: { name: "Ailen Sampó · Propuestas", email: to },
        to: [{ email: to }],
        subject: "Propuesta Mash · nueva apertura",
        textContent: [
          "Alguien abrió la propuesta de Mash Hongos Adaptógenos.",
          "",
          `Fecha: ${openedAt}`,
          `IP (hash): ${ipHash}`,
          `Zona: ${location}`,
          "",
          "Stats: https://ailensampo.com/api/proposals/mash/stats",
        ].join("\n"),
      }),
    });
  } catch {
    // Notificación opcional — no bloquea el tracking.
  }
}

async function notifyAccepted({ ipHash, acceptedAt }) {
  const apiKey = process.env.BREVO_API_KEY;
  const to = process.env.PROPOSAL_NOTIFY_EMAIL;
  if (!apiKey || !to) return;

  try {
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: { name: "Ailen Sampó · Propuestas", email: to },
        to: [{ email: to }],
        subject: "Propuesta Mash · ACEPTADA",
        textContent: [
          "Mash aceptó la propuesta.",
          "",
          `Fecha: ${acceptedAt}`,
          `IP (hash): ${ipHash}`,
        ].join("\n"),
      }),
    });
  } catch {
    // Notificación opcional.
  }
}

module.exports = { notifyOpen, notifyAccepted };
