import { NextResponse } from "next/server";
import { formatGeoLocation } from "@/lib/geo";
import { maskIpHash } from "@/lib/ip";
import { getProposalRepository } from "@/lib/proposals/repository";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const repo = getProposalRepository();
  const proposal = await repo.getBySlug(slug);

  if (!proposal) {
    return NextResponse.json({ error: "Propuesta no encontrada" }, { status: 404 });
  }

  const byIp = await repo.getOpenStats(slug);
  const totalOpens = byIp.reduce((sum, row) => sum + row.count, 0);

  return NextResponse.json({
    slug,
    title: proposal.title,
    status: proposal.status,
    totalOpens,
    uniqueIps: byIp.length,
    byIp: byIp.map((row) => ({
      ...row,
      ipLabel: maskIpHash(row.ipHash),
      location: formatGeoLocation({
        city: row.geoCity,
        region: row.geoRegion,
        country: row.geoCountry,
      }),
    })),
  });
}
