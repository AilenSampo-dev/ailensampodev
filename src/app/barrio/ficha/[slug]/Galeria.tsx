"use client";

import { useState } from "react";
import { portada, type Rubro } from "../../data";
import styles from "../../barrio.module.css";

export default function Galeria({ rubro, fotos }: { rubro: Rubro; fotos: string[] }) {
  const [actual, setActual] = useState(0);

  return (
    <section className={styles.gallery} aria-label="Fotos">
      <div className={styles.photoBig} role="img" aria-label={`Foto: ${fotos[actual]}`} style={{ background: portada(rubro, actual) }}>
        <span className={`${styles.photoLabel} ${styles.pixel}`}>[FOTO] {fotos[actual]}</span>
      </div>
      {fotos.length > 1 ? (
        <div className={styles.thumbs}>
          {fotos.map((titulo, i) => (
            <button
              key={titulo + i}
              type="button"
              aria-label={`Ver foto ${i + 1}: ${titulo}`}
              aria-pressed={actual === i}
              className={`${styles.thumb} ${actual === i ? styles.thumbOn : ""}`}
              style={{ background: portada(rubro, i) }}
              onClick={() => setActual(i)}
            />
          ))}
        </div>
      ) : null}
      <p className={styles.note}>Hasta 6 fotos por ficha · las sube y cambia la emprendedora</p>
    </section>
  );
}
