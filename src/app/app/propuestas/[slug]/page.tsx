import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import CopyProposalLink from "@/components/proposals/CopyProposalLink";
import { formatGeoLocation } from "@/lib/geo";
import { maskIpHash } from "@/lib/ip";
import { getProposalRepository } from "@/lib/proposals/repository";
import { proposalPublicUrl } from "@/lib/proposals/slug";
import styles from "./page.module.css";
type PageProps = {
  params: Promise<{ slug: string }>;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default async function PropuestaStatsPage({ params }: PageProps) {
  const { slug } = await params;
  const repo = getProposalRepository();
  const proposal = await repo.getBySlug(slug);

  if (!proposal) {
    notFound();
  }

  const byIp = await repo.getOpenStats(slug);
  const totalOpens = byIp.reduce((sum, row) => sum + row.count, 0);
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") ?? "http";
  const origin = host ? `${protocol}://${host}` : undefined;
  const publicUrl = proposalPublicUrl(slug, origin);

  return (
    <>
      <p className={styles.back}>
        <Link href="/app/propuestas" className={styles.link}>
          ← Todas las propuestas
        </Link>
      </p>
      <section className={styles.card}>
        <h2>{proposal.title}</h2>
        {proposal.clientName ? (
          <p className={styles.client}>Cliente: {proposal.clientName}</p>
        ) : null}
        <dl className={styles.meta}>          <div>
            <dt>Estado</dt>
            <dd>{proposal.status}</dd>
          </div>
          <div>
            <dt>Total aperturas</dt>
            <dd>{totalOpens}</dd>
          </div>
          <div>
            <dt>IPs distintas</dt>
            <dd>{byIp.length}</dd>
          </div>
        </dl>
        <p>Link para enviar al cliente:</p>
        <CopyProposalLink url={publicUrl} />
        <p className={styles.openLink}>
          <Link href={`/p/${slug}`} className={styles.link}>
            Ver propuesta pública
          </Link>
        </p>
      </section>
      <section className={styles.card}>
        <h3>Aperturas por IP</h3>
        {byIp.length === 0 ? (
          <p className={styles.empty}>
            Todavía no hay aperturas. Abrí{" "}
            <Link href={`/p/${slug}`} className={styles.link}>
              /p/{slug}
            </Link>{" "}
            en otra pestaña y recargá esta página.
          </p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>IP (hash)</th>
                <th>Zona</th>
                <th>Veces</th>
                <th>Primera</th>
                <th>Última</th>
              </tr>
            </thead>
            <tbody>
              {byIp.map((row) => (
                <tr key={row.ipHash}>
                  <td>{maskIpHash(row.ipHash)}</td>
                  <td>
                    {formatGeoLocation({
                      city: row.geoCity,
                      region: row.geoRegion,
                      country: row.geoCountry,
                    }) ?? "—"}
                  </td>
                  <td>{row.count}</td>
                  <td>{formatDate(row.firstOpenedAt)}</td>
                  <td>{formatDate(row.lastOpenedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className={styles.note}>
          Panel sin login por ahora. En Fase 4 se protege con Firebase Auth.
        </p>
      </section>
    </>
  );
}
