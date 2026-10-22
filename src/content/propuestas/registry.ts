/**
 * @deprecated Las propuestas se descubren solas desde src/content/propuestas/[slug]/.
 */
import type { Proposal } from "@/types/erp";
import {
  loadContentProposals,
  loadDocumentHtml,
} from "@/lib/proposals/content";

export const documentProposals: Proposal[] = loadContentProposals();

export function getDocumentHtml(slug: string): string | null {
  return loadDocumentHtml(slug);
}
