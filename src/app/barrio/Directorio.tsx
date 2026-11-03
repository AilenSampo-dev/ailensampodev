"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FICHAS, RUBROS, linkWhatsApp, portada, type Rubro } from "./data";
import { IconoWhatsApp } from "./Header";
import styles from "./barrio.module.css";

type Filtro = "Todos" | Rubro;

function normalizar(t: string) {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function Directorio() {
  const [q, setQ] = useState("");
  const [rubro, setRubro] = useState<Filtro>("Todos");

  const resultados = useMemo(() => {
    const term = normalizar(q.trim());
    return FICHAS.filter((f) => {
      if (rubro !== "Todos" && f.rubro !== rubro) return false;
      if (!term) return true;
      return normalizar([f.nombre, f.rubro, f.descripcion, ...f.ofrece].join(" ")).includes(term);
    });
  }, [q, rubro]);

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={`${styles.pill} ${styles.pixel}`}>{FICHAS.length} emprendimientos de vecinos</span>
          <h1 className={styles.h1}>Lo que buscás ya está en el barrio. Ahora también se encuentra.</h1>
          <p className={styles.lead}>Todos los emprendimientos de los grupos de WhatsApp, ordenados por rubro. Sin scrollear mil fotos.</p>
          <form className={styles.searchBox} role="search" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="buscar" className={styles.srOnly}>Buscar en el directorio</label>
            <input
              id="buscar"
              type="search"
              className={styles.searchInput}
              placeholder="¿Qué necesitás? Ej: electricista, tortas"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button
              type="button"
              className={styles.btnDark}
              onClick={() => {
                setQ("");
                setRubro("Todos");
              }}
            >
              Limpiar
            </button>
          </form>
        </div>
      </section>

      <div id="rubros" className={styles.chips} role="group" aria-label="Filtrar por rubro">
        {(["Todos", ...RUBROS] as Filtro[]).map((r) => (
          <button
            key={r}
            type="button"
            aria-pressed={rubro === r}
            className={`${styles.chip} ${rubro === r ? styles.chipOn : ""}`}
            onClick={() => setRubro(r)}
          >
            {r}
          </button>
        ))}
      </div>

      <section className={`${styles.container} ${styles.section}`} aria-live="polite">
        <div className={styles.sectionHead}>
          <h2 className={styles.h2}>
            {rubro === "Todos" ? "Todos los emprendimientos" : rubro} · {resultados.length}
          </h2>
          <span className={styles.muted}>Datos de ejemplo</span>
        </div>

        {resultados.length > 0 ? (
          <div className={styles.grid}>
            {resultados.map((f) => (
              <article key={f.slug} className={styles.card}>
                <div className={styles.cover} style={{ background: portada(f.rubro) }}>
                  <span className={`${styles.coverTag} ${styles.pixel}`}>{f.rubro}</span>
                  <span className={styles.coverCount}>
                    {f.fotos.length} {f.fotos.length === 1 ? "foto" : "fotos"}
                  </span>
                </div>
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{f.nombre}</h3>
                  <p className={styles.cardText}>{f.descripcion}</p>
                  <p className={styles.muted}>
                    {/^\d/.test(f.manzana) ? `Manzana ${f.manzana}` : f.manzana} · {f.modalidad}
                  </p>
                  <Link href={`/barrio/ficha/${f.slug}`} className={styles.btnOutline}>Ver ficha y fotos</Link>
                  <a href={linkWhatsApp(f)} target="_blank" rel="noopener noreferrer" className={styles.btnWa}>
                    <IconoWhatsApp /> Escribile por WhatsApp
                  </a>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <div className={`${styles.emptyFace} ${styles.pixel}`} aria-hidden="true">(o_o)</div>
            <p>
              Todavía nadie del barrio ofrece eso. ¿Lo hacés vos?{" "}
              <Link href="/barrio/alta" style={{ fontWeight: 800 }}>Sumalo acá</Link>.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
