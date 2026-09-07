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
