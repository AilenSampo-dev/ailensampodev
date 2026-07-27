import { NextResponse } from "next/server";
import type { CreateProposalInput } from "@/types/erp";
import { getProposalRepository } from "@/lib/proposals/repository";
import { proposalPublicUrl } from "@/lib/proposals/slug";

function parseCreateInput(body: unknown): CreateProposalInput | null {
  if (!body || typeof body !== "object") return null;

  const data = body as Record<string, unknown>;
  const sections = data.sections;

  if (
    typeof data.clientName !== "string" ||
    typeof data.title !== "string" ||
    typeof data.summary !== "string" ||
    typeof data.price !== "string" ||
    typeof data.timeline !== "string" ||
    !Array.isArray(sections)
  ) {
    return null;
  }

  const parsedSections = sections
    .map((section) => {
      if (!section || typeof section !== "object") return null;
      const item = section as Record<string, unknown>;
      if (typeof item.title !== "string" || typeof item.body !== "string") {
        return null;
      }
      return { title: item.title, body: item.body };
    })
    .filter((section): section is { title: string; body: string } =>
      Boolean(section)
    );

  if (parsedSections.length === 0) return null;

  return {
    clientName: data.clientName,
    title: data.title,
    summary: data.summary,
    price: data.price,
    timeline: data.timeline,
    sections: parsedSections,
  };
}

export async function GET() {
  const repo = getProposalRepository();
  const proposals = await repo.listAll();

  return NextResponse.json({
    proposals: proposals.map((proposal) => ({
      ...proposal,
      publicUrl: proposalPublicUrl(proposal.slug),
    })),
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const input = parseCreateInput(body);
  if (!input) {
    return NextResponse.json(
      { error: "Datos incompletos o inválidos" },
      { status: 400 }
    );
  }

  if (!input.clientName.trim() || !input.title.trim() || !input.price.trim()) {
    return NextResponse.json(
      { error: "Cliente, título y precio son obligatorios" },
      { status: 400 }
    );
  }

  const repo = getProposalRepository();
  const proposal = await repo.create(input);

  return NextResponse.json({
    proposal,
    publicUrl: proposalPublicUrl(proposal.slug),
  });
}
