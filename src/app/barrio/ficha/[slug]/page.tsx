import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NOMBRE_BARRIO } from "../../constants";
import Header, { Footer, IconoWhatsApp } from "../../Header";
import { FICHAS, PORTADAS, linkWhatsApp } from "../../data";
import Galeria from "./Galeria";
import Reportar from "./Reportar";
import styles from "../../barrio.module.css";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return FICHAS.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const f = FICHAS.find((x) => x.slug === slug);
  return { title: f ? `${f.nombre} — ${NOMBRE_BARRIO}` : NOMBRE_BARRIO };
}

export default async function FichaPage({ params }: Props) {
  const { slug } = await params;
  const f = FICHAS.find((x) => x.slug === slug);
  if (!f) notFound();

  const donde = /^\d/.test(f.manzana) ? `Manzana ${f.manzana}` : f.manzana;

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.backBar}>
          <Link href="/barrio" className={styles.backLink}>← Volver al directorio</Link>
        </div>

        <main className={styles.fichaLayout}>
          <Galeria rubro={f.rubro} fotos={f.fotos} />

          <section className={styles.fichaInfo}>
            <div className={styles.tags}>
              <span className={`${styles.tag} ${styles.pixel}`} style={{ background: PORTADAS[f.rubro][0] }}>{f.rubro}</span>
              <span className={styles.tagOk}>Activo · confirmado este mes</span>
            </div>
            <h1 className={styles.fichaTitle}>{f.nombre}</h1>
            <p className={styles.fichaDesc}>{f.descripcion}</p>

            <a href={linkWhatsApp(f)} target="_blank" rel="noopener noreferrer" className={`${styles.btnWa} ${styles.btnWaBig}`}>
              <IconoWhatsApp size={20} /> Escribile por WhatsApp
            </a>
            {f.instagram ? (
              <a href={`https://instagram.com/${f.instagram}`} target="_blank" rel="noopener noreferrer" className={styles.btnOutline}>
                Ver Instagram
              </a>
            ) : null}

            <dl className={`${styles.box} ${styles.datos}`}>
              <dt>Horarios</dt>
              <dd>{f.horarios}</dd>
              <dt>Dónde</dt>
              <dd>{donde}</dd>
              <dt>Entrega</dt>
              <dd>{f.entrega}</dd>
              <dt>Pagos</dt>
              <dd>{f.pagos}</dd>
            </dl>

            <div className={styles.box}>
              <h2 className={styles.boxTitle}>Lo que ofrece</h2>
              <div className={styles.softChips}>
                {f.ofrece.map((o) => (
                  <span key={o} className={styles.softChip}>{o}</span>
                ))}
              </div>
            </div>

            <Reportar />
          </section>
        </main>
      </div>
      <Footer />
    </>
  );
}
