import { readFileSync, readdirSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { Proposal, ProposalStatus } from "@/types/erp";

export type ProposalFormat = "simple" | "document";

export type ProposalContentMeta = {
  slug: string;
  clientName: string;
  title: string;
  summary: string;
  price: string;
  timeline: string;
  format: ProposalFormat;
  status: ProposalStatus;
  createdAt: string;
  sentAt?: string;
};

const CONTENT_ROOT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "content",
  "propuestas"
);

export function getProposalContentDir(slug: string): string {
  return path.join(CONTENT_ROOT, slug);
}

export function loadContentMeta(slug: string): ProposalContentMeta | null {
  const metaPath = path.join(getProposalContentDir(slug), "meta.json");
  if (!existsSync(metaPath)) return null;

  const raw = readFileSync(metaPath, "utf8");
  return JSON.parse(raw) as ProposalContentMeta;
}

export function loadDocumentHtml(slug: string): string | null {
  const htmlPath = path.join(getProposalContentDir(slug), "propuesta.html");
  if (!existsSync(htmlPath)) return null;
  return readFileSync(htmlPath, "utf8");
}

export function listContentProposalSlugs(): string[] {
  if (!existsSync(CONTENT_ROOT)) return [];

  return readdirSync(CONTENT_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((slug) => existsSync(path.join(CONTENT_ROOT, slug, "meta.json")));
}

export function contentMetaToProposal(meta: ProposalContentMeta): Proposal {
  return {
    id: `content_${meta.slug}`,
    slug: meta.slug,
    clientId: `client_${meta.slug}`,
    clientName: meta.clientName,
    projectId: `project_${meta.slug}`,
    title: meta.title,
    summary: meta.summary,
    sections: [],
    price: meta.price,
    timeline: meta.timeline,
    format: meta.format,
    status: meta.status,
    createdAt: meta.createdAt,
    sentAt: meta.sentAt ?? meta.createdAt,
  };
}

export function loadContentProposals(): Proposal[] {
  return listContentProposalSlugs()
    .map((slug) => loadContentMeta(slug))
    .filter((meta): meta is ProposalContentMeta => Boolean(meta))
    .map(contentMetaToProposal);
}

export function injectDocumentTracking(html: string, slug: string): string {
  const injection = `
<script>
(function(){
  var slug = ${JSON.stringify(slug)};
  var params = new URLSearchParams(window.location.search);
  fetch('/api/proposals/' + slug + '/open?' + params.toString(), { method: 'POST' }).catch(function(){});
})();
</script>
`;

  if (html.includes("</body>")) {
    return html.replace("</body>", `${injection}</body>`);
  }

  return html + injection;
}
