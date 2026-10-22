import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProposalView from "@/components/proposals/ProposalView";
import { getProposalRepository } from "@/lib/proposals/repository";
import styles from "./page.module.css";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const proposal = await getProposalRepository().getBySlug(slug);

  if (!proposal) {
    return { title: "Propuesta no encontrada" };
  }

  return {
    title: `${proposal.title} — Propuesta`,
    description: proposal.summary,
    robots: { index: false, follow: false },
  };
}

export default async function ProposalPage({ params }: PageProps) {
  const { slug } = await params;
  const proposal = await getProposalRepository().getBySlug(slug);

  if (!proposal) {
    notFound();
  }

  if (proposal.format === "document") {
    return (
      <iframe
        className={styles.documentFrame}
        src={`/api/proposals/${slug}/document`}
        title={proposal.title}
      />
    );
  }

  return (
    <main className={styles.page}>
      <p className={styles.brand}>Ailen Sampó</p>
      <ProposalView proposal={proposal} />
    </main>
  );
}
