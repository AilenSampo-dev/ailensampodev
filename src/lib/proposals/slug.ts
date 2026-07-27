import { randomBytes } from "crypto";

export function createProposalSlug(): string {
  return randomBytes(5).toString("hex");
}

export function proposalPublicPath(slug: string): string {
  return `/p/${slug}`;
}

export function proposalPublicUrl(slug: string, origin?: string): string {
  const base =
    origin ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://ailensampo.com";
  return `${base.replace(/\/$/, "")}/p/${slug}`;
}
