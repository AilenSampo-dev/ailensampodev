import { existsSync, readFileSync } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getProposalContentDir } from "@/lib/proposals/content";
import { getProposalRepository } from "@/lib/proposals/repository";

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

type RouteContext = {
  params: Promise<{ slug: string; file: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug, file } = await context.params;
  const safeName = path.basename(decodeURIComponent(file));

  if (!safeName || safeName.includes("..") || safeName.includes("/")) {
    return NextResponse.json({ error: "Archivo inválido" }, { status: 400 });
  }

  const proposal = await getProposalRepository().getBySlug(slug);
  if (!proposal || proposal.format !== "document") {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const filePath = path.join(getProposalContentDir(slug), safeName);
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const ext = path.extname(safeName).toLowerCase();
  const contentType = MIME[ext] ?? "application/octet-stream";

  return new NextResponse(readFileSync(filePath), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
