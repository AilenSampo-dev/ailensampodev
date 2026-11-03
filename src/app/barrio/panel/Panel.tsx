"use client";

import { useState } from "react";
import Link from "next/link";
import { FICHAS, portada } from "../data";
import styles from "../barrio.module.css";

// Demo del panel de la emprendedora. En la versión real se entra con el código por mail
// y cada acción se valida en el servidor contra la dueña de la ficha.

const f = FICHAS[0];

export default function Panel() {
  const [pausada, setPausada] = useState(false);

  return (
    <>
      <header className={styles.panelHeader}>
        <div className={`${styles.container} ${styles.panelHeaderInner}`}>
          <Link href="/barrio" className={styles.backLink} style={{ color: "#fff" }}>← Directorio</Link>
          <span>Entraste con tu mail · fl•••@mail.com</span>
        </div>
      </header>

      <main className={styles.panelMain}>
        <div className={styles.panelHead}>
          <div className={styles.panelThumb} style={{ background: portada(f.rubro) }} aria-hidden="true" />
          <div className={styles.panelName}>
            <h1 className={styles.fichaTitle} style={{ fontSize: "clamp(26px, 5vw, 32px)" }}>{f.nombre}</h1>
            <p className={styles.muted}>{f.rubro} · Manzana {f.manzana}</p>
          </div>
          <Link href={`/barrio/ficha/${f.slug}`} className={styles.btnOutline}>Ver cómo la ven</Link>
        </div>

        <section className={`${styles.status} ${pausada ? styles.statusPaused : ""}`} aria-live="polite">
          <div className={styles.statusText}>
            <span className={`${styles.statusTitle} ${styles.pixel}`}>{pausada ? "Pausada" : "Activa y visible"}</span>
            <span>
              {pausada
                ? "Nadie ve tu ficha hasta que la reactives. Tus datos y fotos quedan guardados."
                : "Tu ficha aparece en el directorio y en las búsquedas. ¿Te vas de vacaciones? Pausala sin perder nada."}
            </span>
          </div>
          <button type="button" className={styles.btnDark} style={{ minHeight: 48 }} onClick={() => setPausada((p) => !p)}>
            {pausada ? "Reactivar mi ficha" : "Pausar (vacaciones)"}
          </button>
        </section>

        <div className={styles.actions}>
          <Link href="/barrio/alta" className={styles.actionCard}>
            <span className={styles.actionTitle}>Editar datos</span>
            <span className={styles.muted}>Nombre, rubro, descripción y palabras clave</span>
          </Link>
          <Link href="/barrio/alta" className={styles.actionCard}>
            <span className={styles.actionTitle}>Fotos · {f.fotos.length} de 6</span>
            <span className={styles.muted}>Sumá, borrá o elegí la portada</span>
          </Link>
          <Link href="/barrio/alta" className={styles.actionCard}>
            <span className={styles.actionTitle}>Horarios, entrega y pagos</span>
            <span className={styles.muted}>Lo que más te preguntan, siempre al día</span>
          </Link>
        </div>

        <section className={styles.box}>
          <h2 className={styles.boxTitle}>Lo que el sistema hace por vos</h2>
          <div className={styles.sysItem}>
            <span className={`${styles.sysNum} ${styles.pixel}`}>01</span>
            <span>Una vez por mes te llega un mail para confirmar que seguís activa. Si no respondés en 60 días, tu ficha se oculta (no se borra).</span>
          </div>
          <div className={styles.sysItem}>
            <span className={`${styles.sysNum} ${styles.pixel}`}>02</span>
            <span>Reportes de vecinos: ninguno. Con 3, la ficha se pausa y te avisamos para que la revises.</span>
          </div>
          <div className={styles.sysItem}>
            <span className={`${styles.sysNum} ${styles.pixel}`}>03</span>
            <span>¿Cambiaste de celu? No pasa nada: entrás con tu mail.</span>
          </div>
        </section>

        <button type="button" className={styles.textBtn}>Dar de baja mi ficha</button>
      </main>
    </>
  );
}
