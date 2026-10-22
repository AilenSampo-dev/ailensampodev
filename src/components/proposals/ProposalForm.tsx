"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./ProposalForm.module.css";

const DEFAULT_SECTIONS = [
  { title: "Alcance", body: "" },
  { title: "Entregables", body: "" },
  { title: "Condiciones", body: "" },
];

export default function ProposalForm() {
  const router = useRouter();
  const [clientName, setClientName] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [price, setPrice] = useState("");
  const [timeline, setTimeline] = useState("");
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateSection(index: number, field: "title" | "body", value: string) {
    setSections((current) =>
      current.map((section, i) =>
        i === index ? { ...section, [field]: value } : section
      )
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          title,
          summary,
          price,
          timeline,
          sections,
        }),
      });

      const data = (await res.json()) as {
        error?: string;
        proposal?: { slug: string };
      };

      if (!res.ok || !data.proposal) {
        setError(data.error ?? "No se pudo crear la propuesta.");
        return;
      }

      router.push(`/app/propuestas/${data.proposal.slug}`);
      router.refresh();
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor="clientName">Cliente</label>
        <input
          id="clientName"
          value={clientName}
          onChange={(event) => setClientName(event.target.value)}
          placeholder="Nombre o empresa"
          required
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="title">Título del presupuesto</label>
        <input
          id="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ej: Sitio web + panel interno"
          required
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="summary">Resumen</label>
        <textarea
          id="summary"
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          placeholder="Breve descripción para el cliente"
          required
        />
      </div>

      <div className={styles.grid}>
        <div className={styles.field}>
          <label htmlFor="price">Precio</label>
          <input
            id="price"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="USD 2.400"
            required
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="timeline">Plazo</label>
          <input
            id="timeline"
            value={timeline}
            onChange={(event) => setTimeline(event.target.value)}
            placeholder="6 semanas"
            required
          />
        </div>
      </div>

      {sections.map((section, index) => (
        <div key={section.title} className={styles.field}>
          <label htmlFor={`section-${index}`}>{section.title}</label>
          <textarea
            id={`section-${index}`}
            value={section.body}
            onChange={(event) =>
              updateSection(index, "body", event.target.value)
            }
            placeholder={`Detalle de ${section.title.toLowerCase()}`}
            required
          />
        </div>
      ))}

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.actions}>
        <button
          type="submit"
          className={styles.primaryBtn}
          disabled={submitting}
        >
          {submitting ? "Creando…" : "Crear y obtener link"}
        </button>
        <Link href="/app/propuestas" className={styles.secondaryBtn}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
