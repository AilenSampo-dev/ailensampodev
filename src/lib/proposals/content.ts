import { readFileSync, readdirSync, existsSync } from "fs";
import path from "path";
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

const CONTENT_ROOT = path.join(process.cwd(), "src", "content", "propuestas");

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
<div id="as-proposal-actions" style="position:fixed;bottom:0;left:0;right:0;z-index:9999;padding:12px 16px;background:rgba(26,16,48,.92);backdrop-filter:blur(8px);display:flex;gap:10px;justify-content:center;align-items:center;font-family:system-ui,sans-serif">
  <button id="as-proposal-accept" type="button" style="padding:12px 20px;border:none;background:#F656BF;color:#fff;font:inherit;font-weight:700;cursor:pointer">Aceptar propuesta</button>
  <span id="as-proposal-status" style="color:#E1ADFF;font-size:14px"></span>
</div>
<style>@media print{#as-proposal-actions{display:none!important}}</style>
<script>
(function(){
  var slug = ${JSON.stringify(slug)};
  var storageKey = 'as-proposal-' + slug + '-accepted';
  var params = new URLSearchParams(window.location.search);
  var btn = document.getElementById('as-proposal-accept');
  var status = document.getElementById('as-proposal-status');

  function showAccepted() {
    if (!btn || !status) return;
    btn.style.display = 'none';
    status.textContent = 'Propuesta aceptada';
    try { localStorage.setItem(storageKey, '1'); } catch (e) {}
  }

  try {
    if (localStorage.getItem(storageKey) === '1') showAccepted();
  } catch (e) {}

  fetch('/api/proposals/' + slug + '/open?' + params.toString(), { method: 'POST' })
    .then(function(r){ return r.json().catch(function(){ return {}; }); })
    .then(function(d){ if (d && d.status === 'accepted') showAccepted(); })
    .catch(function(){});

  if (!btn) return;

  btn.addEventListener('click', function(){
    btn.disabled = true;
    fetch('/api/proposals/' + slug + '/accept', { method: 'POST' })
      .then(function(r){ return r.json().then(function(d){ return { ok: r.ok, status: r.status, d: d }; }); })
      .then(function(res){
        if (res.ok || res.status === 409) {
          showAccepted();
          return;
        }
        status.textContent = res.d.error || 'No se pudo aceptar.';
        btn.disabled = false;
      })
      .catch(function(){
        status.textContent = 'Error de conexión.';
        btn.disabled = false;
      });
  });
})();
</script>
`;

  if (html.includes("</body>")) {
    return html.replace("</body>", `${injection}</body>`);
  }

  return html + injection;
}
