import { NextResponse } from "next/server";
import { getClientRepository } from "@/lib/clients/repository";
import { sendAdminEmail } from "@/lib/email/brevo";
import { getClientIp, hashIp } from "@/lib/ip";
import { getProposalRepository } from "@/lib/proposals/repository";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

type AcceptBody = {
  email?: string;
  contactName?: string;
};

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const repo = getProposalRepository();
  const proposal = await repo.getBySlug(slug);

  if (!proposal) {
    return NextResponse.json({ error: "Propuesta no encontrada" }, { status: 404 });
  }

  if (proposal.status === "accepted") {
    return NextResponse.json(
      { error: "Esta propuesta ya fue aceptada", status: proposal.status },
      { status: 409 }
    );
  }

  let body: AcceptBody = {};
  try {
    body = (await request.json()) as AcceptBody;
  } catch {
    body = {};
  }

  const email = body.email?.trim() ?? "";
  const contactName = body.contactName?.trim() ?? "";

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Ingresá un email válido" }, { status: 400 });
  }

  if (!contactName) {
    return NextResponse.json({ error: "Ingresá tu nombre" }, { status: 400 });
  }

  const ip = getClientIp(request);
  const ipHash = hashIp(ip);
  const acceptedAt = new Date().toISOString();
  const updated = await repo.accept(slug, ipHash);

  if (!updated) {
    return NextResponse.json({ error: "No se pudo aceptar la propuesta" }, { status: 500 });
  }

  const client = await getClientRepository().upsertFromProposal({
    name: contactName,
    email,
    company: proposal.clientName ?? contactName,
    proposalSlug: slug,
    proposalTitle: proposal.title,
    acceptedAt,
  });

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const adminEmail = process.env.ADMIN_EMAIL ?? process.env.BREVO_FROM_EMAIL ?? "hola@ailensampo.com";

  await sendAdminEmail({
    to: adminEmail,
    replyTo: email,
    subject: `Propuesta aceptada — ${proposal.clientName ?? slug}`,
    html: `
      <p><strong>${contactName}</strong> aceptó la propuesta <strong>${proposal.title}</strong>.</p>
      <ul>
        <li>Cliente: ${proposal.clientName ?? "—"}</li>
        <li>Email: ${email}</li>
        <li>Precio: ${proposal.price}</li>
        <li>Slug: ${slug}</li>
      </ul>
      <p><a href="${appUrl}/app/clientes">Ver clientes en el ERP</a> ·
      <a href="${appUrl}/app/propuestas/${slug}">Ver propuesta</a></p>
      <p style="color:#666;font-size:12px">Podés enviar el contrato desde el ERP.</p>
    `,
  });

  return NextResponse.json({
    ok: true,
    status: updated.status,
    acceptedAt: updated.acceptedAt,
    clientId: client.id,
    emailSent: Boolean(process.env.BREVO_API_KEY),
  });
}
