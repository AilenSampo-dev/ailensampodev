import { NextResponse } from "next/server";
import { loadDemoHtml } from "@/lib/proposals/content";
import { getProposalRepository } from "@/lib/proposals/repository";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const proposal = await getProposalRepository().getBySlug(slug);

  if (!proposal || proposal.format !== "document") {
    return NextResponse.json({ error: "Demo no encontrado" }, { status: 404 });
  }

  const html = loadDemoHtml(slug);
  if (!html) {
    return NextResponse.json({ error: "HTML no encontrado" }, { status: 404 });
  }

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
