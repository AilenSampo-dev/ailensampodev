import Link from "next/link";
import { getClientRepository } from "@/lib/clients/repository";
import styles from "./page.module.css";

export default async function ClientesPage() {
  const clients = await getClientRepository().listAll();

  return (
    <section className={styles.page}>
      <div>
        <h2>Clientes</h2>
        <p className={styles.lead}>
          Leads y clientes que aceptaron una propuesta. Desde acá podés hacer seguimiento
          y enviar el contrato.
        </p>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Empresa</th>
              <th>Propuesta</th>
              <th>Estado</th>
              <th>Aceptada</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.empty}>
                  Todavía no hay clientes. Aparecen acá cuando alguien acepta una propuesta.
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr key={client.id}>
                  <td>{client.name}</td>
                  <td>
                    <a className={styles.link} href={`mailto:${client.email}`}>
                      {client.email}
                    </a>
                  </td>
                  <td>{client.company ?? "—"}</td>
                  <td>
                    {client.proposalSlug ? (
                      <Link
                        className={styles.link}
                        href={`/app/propuestas/${client.proposalSlug}`}
                      >
                        {client.proposalTitle ?? client.proposalSlug}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <span className={styles.badge}>{client.status}</span>
                  </td>
                  <td>
                    {client.acceptedAt
                      ? new Date(client.acceptedAt).toLocaleString("es-AR")
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
