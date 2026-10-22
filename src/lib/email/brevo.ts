type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

export async function sendAdminEmail(input: SendEmailInput): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.BREVO_FROM_EMAIL ?? "hola@ailensampo.com";
  const adminEmail = process.env.ADMIN_EMAIL ?? fromEmail;

  if (!apiKey) {
    console.warn("[brevo] BREVO_API_KEY no configurada — email no enviado:", input.subject);
    return false;
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { email: fromEmail, name: "s(a) · Ailén Sampó" },
      to: [{ email: input.to || adminEmail }],
      replyTo: input.replyTo ? { email: input.replyTo } : undefined,
      subject: input.subject,
      htmlContent: input.html,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("[brevo] Error al enviar email:", response.status, detail);
    return false;
  }

  return true;
}

type SendInput = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  /** Remitente; por defecto BREVO_FROM_EMAIL (hola@). */
  fromEmail?: string;
  fromName?: string;
  /** Adjuntos en base64, ej. [{ name: "arquitectura.pdf", content: "<base64>" }] */
  attachments?: { name: string; content: string }[];
};

/** Envío genérico por Brevo (transaccional). Devuelve false si falta la clave o Brevo rechaza. Nunca lanza. */
export async function sendEmail(input: SendInput): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY?.trim().replace(/^["']|["']$/g, "");
  if (!apiKey) {
    console.warn("[brevo] BREVO_API_KEY no configurada — email no enviado:", input.subject);
    return false;
  }
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        sender: {
          email: input.fromEmail ?? process.env.BREVO_FROM_EMAIL ?? "hola@ailensampo.com",
          name: input.fromName ?? "Ailén Sampó",
        },
        to: [{ email: input.to }],
        replyTo: input.replyTo ? { email: input.replyTo } : undefined,
        subject: input.subject,
        htmlContent: input.html,
        attachment: input.attachments?.length ? input.attachments : undefined,
      }),
    });
    if (!response.ok) {
      console.error("[brevo] Error al enviar:", response.status, await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("[brevo] Falló el envío:", (error as Error).message);
    return false;
  }
}

/**
 * Remitente para avisos internos a hola@: no puede ser hola@ (Zoho rebota el bucle, ver ERP
 * erp/server/brevo-admin-copy.js). Usa BREVO_INTERNAL_SENDER si está, si no avisos@ (dominio autenticado).
 */
export function internalSender(): string {
  return process.env.BREVO_INTERNAL_SENDER?.trim() || "avisos@ailensampo.com";
}

export function adminInbox(): string {
  return process.env.ADMIN_EMAIL?.trim() || process.env.BREVO_FROM_EMAIL?.trim() || "hola@ailensampo.com";
}
