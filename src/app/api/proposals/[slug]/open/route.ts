import { NextResponse } from "next/server";
import { resolveGeo } from "@/lib/geo";
import { getClientIp, hashIp } from "@/lib/ip";
import { getProposalRepository } from "@/lib/proposals/repository";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const repo = getProposalRepository();
  const proposal = await repo.getBySlug(slug);

  if (!proposal) {
    return NextResponse.json({ error: "Propuesta no encontrada" }, { status: 404 });
  }

  const ip = getClientIp(request);
  const ipHash = hashIp(ip);
  const geo = await resolveGeo(request, ip);
  const referrer = request.headers.get("referer") ?? undefined;
  const userAgent = request.headers.get("user-agent") ?? undefined;

  const url = new URL(request.url);
  const utmSource = url.searchParams.get("utm_source") ?? undefined;
  const utmMedium = url.searchParams.get("utm_medium") ?? undefined;
  const utmCampaign = url.searchParams.get("utm_campaign") ?? undefined;

  const open = await repo.recordOpen(slug, {
    ipHash,
    openedAt: new Date().toISOString(),
    referrer,
    userAgent,
    utmSource,
    utmMedium,
    utmCampaign,
    geoCountry: geo.country,
    geoRegion: geo.region,
    geoCity: geo.city,
  });

  return NextResponse.json({ ok: true, openId: open?.id });
}
