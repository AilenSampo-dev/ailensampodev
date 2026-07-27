import { NextResponse } from "next/server";
import { getClientIp, hashIp } from "@/lib/ip";
import { getProposalRepository } from "@/lib/proposals/repository";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
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

  const ip = getClientIp(_request);
  const ipHash = hashIp(ip);
  const updated = await repo.accept(slug, ipHash);

  return NextResponse.json({
    ok: true,
    status: updated?.status,
    acceptedAt: updated?.acceptedAt,
  });
}
