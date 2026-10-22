"use client";

import { useEffect } from "react";
import type { Proposal } from "@/types/erp";
import styles from "./ProposalView.module.css";

type Props = {
  proposal: Proposal;
};

export default function ProposalView({ proposal }: Props) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    fetch(`/api/proposals/${proposal.slug}/open?${params.toString()}`, {
      method: "POST",
    }).catch(() => {
      // Tracking silencioso — no bloquea la vista de la propuesta.
    });
  }, [proposal.slug]);

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Propuesta comercial</p>
        <h1 className={styles.title}>{proposal.title}</h1>
        <p className={styles.summary}>{proposal.summary}</p>
      </header>

      <div className={styles.meta}>
        <div>
          <span className={styles.metaLabel}>Inversión</span>
          <strong>{proposal.price}</strong>
        </div>
        <div>
          <span className={styles.metaLabel}>Plazo estimado</span>
          <strong>{proposal.timeline}</strong>
        </div>
      </div>

      <section className={styles.sections}>
        {proposal.sections.map((section) => (
          <div key={section.title} className={styles.section}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </div>
        ))}
      </section>
    </article>
  );
}
