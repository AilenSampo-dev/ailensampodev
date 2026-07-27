import Link from "next/link";
import { getProposalRepository } from "@/lib/proposals/repository";
import { proposalPublicPath } from "@/lib/proposals/slug";
import styles from "./page.module.css";

export default async function PropuestasPage() {
  const proposals = await getProposalRepository().listAll();

  return (
    <section className={styles.card}>
      <div className={styles.toolbar}>
        <h2>Propuestas</h2>
        <Link href="/app/propuestas/nueva" className={styles.newBtn}>
          + Nueva propuesta
        </Link>
      </div>

      {proposals.length === 0 ? (
        <p className={styles.empty}>
          Todavía no hay propuestas. Creá una y obtené el link para enviar al
          cliente.
        </p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Presupuesto</th>
              <th>Estado</th>
              <th>Tipo</th>
              <th>Aperturas</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {proposals.map((proposal) => (
              <tr key={proposal.slug}>
                <td>{proposal.clientName ?? "—"}</td>
                <td>{proposal.title}</td>
                <td>{proposal.status}</td>
                <td>
                  {proposal.format === "document" ? "documento" : "formulario"}
                </td>
                <td>
                  {proposal.totalOpens} ({proposal.uniqueIps} IP
                  {proposal.uniqueIps === 1 ? "" : "s"})
                </td>
                <td>
                  <Link
                    href={`/app/propuestas/${proposal.slug}`}
                    className={styles.link}
                  >
                    Ver tracking
                  </Link>
                  {" · "}
                  <Link href={proposalPublicPath(proposal.slug)} className={styles.link}>
                    Abrir
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className={styles.note}>
        Propuestas HTML a medida: carpeta <code>content/propuestas/[slug]/</code>.
        Formulario rápido: <Link href="/app/propuestas/nueva" className={styles.link}>Nueva propuesta</Link>.
      </p>
    </section>
  );
}
