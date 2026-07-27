import type { Proposal } from "@/types/erp";
import {
  contentMetaToProposal,
  type ProposalContentMeta,
} from "@/lib/proposals/content";
import stockinLavandaHtml from "./stockin-lavanda/propuesta.html";
import stockinLavandaMeta from "./stockin-lavanda/meta.json";

const documentHtmlBySlug: Record<string, string> = {
  "stockin-lavanda": stockinLavandaHtml,
};

export const documentProposals: Proposal[] = [
  contentMetaToProposal(stockinLavandaMeta as ProposalContentMeta),
];

export function getDocumentHtml(slug: string): string | null {
  return documentHtmlBySlug[slug] ?? null;
}
