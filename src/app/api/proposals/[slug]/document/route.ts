import { NextResponse } from "next/server";
import {
  injectDocumentTracking,
  loadDocumentHtml,
} from "@/lib/proposals/content";
import { getProposalRepository } from "@/lib/proposals/repository";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const proposal = await getProposalRepository().getBySlug(slug);

  if (!proposal || proposal.format !== "document") {
    return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
  }

  const html = loadDocumentHtml(slug);
  if (!html) {
    return NextResponse.json({ error: "HTML no encontrado" }, { status: 404 });
  }

  const body = injectDocumentTracking(html, slug);

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
