"use client";

import { useState } from "react";
import Link from "next/link";
import { RUBROS } from "../data";
import styles from "../barrio.module.css";

// Demo del alta autogestionada en 4 pasos. En la versión real:
// - el paso 4 manda un código al mail (proveedor con plan gratis) y valida manzana/lote contra el plano del barrio;
// - la ficha queda atada a ese mail (solo su dueña puede editarla, validado en el servidor).

const MANZANAS = Array.from({ length: 40 }, (_, i) => String(i + 1));
const LOTES = Array.from({ length: 30 }, (_, i) => String(i + 1));

const TITULOS = ["Contanos qué hacés", "Mostrá lo que hacés", "Los detalles que siempre te preguntan", "Confirmá que sos del barrio"];

export default function Alta() {
  const [paso, setPaso] = useState(1);
  const terminado = paso > 4;

  return (
    <div className={styles.altaWrap}>
      <div className={styles.altaInner}>
        <div className={styles.altaTop}>
          <Link href="/barrio" className={styles.backLink}>← Directorio</Link>
          {!terminado ? <span className={`${styles.stepCount} ${styles.pixel}`}>Paso {paso} de 4</span> : null}
        </div>

        <div className={styles.progress} aria-hidden="true">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className={`${styles.bar} ${n <= paso ? styles.barOn : ""}`} />
          ))}
        </div>

        <form className={styles.formCard} onSubmit={(e) => e.preventDefault()}>
          {!terminado ? <h1 className={styles.formTitle}>{TITULOS[paso - 1]}</h1> : null}

          {paso === 1 ? (
            <>
              <div className={styles.field}>
                <label htmlFor="a-nombre" className={styles.label}>Nombre del emprendimiento</label>
                <input id="a-nombre" type="text" className={styles.input} placeholder="Ej: Tortas de la Flor" />
              </div>
              <div className={styles.field}>
                <label htmlFor="a-rubro" className={styles.label}>Rubro</label>
                <select id="a-rubro" className={styles.input} defaultValue="">
                  <option value="" disabled>Elegí un rubro</option>
                  {RUBROS.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                  <option>Otro (lo sugerís vos)</option>
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="a-desc" className={styles.label}>Descripción corta</label>
                <textarea id="a-desc" rows={3} className={`${styles.input} ${styles.textarea}`} placeholder="Qué ofrecés y qué te hace distinta, en 2 o 3 líneas" />
              </div>
              <div className={styles.field}>
                <label htmlFor="a-tags" className={styles.label}>Palabras para que te encuentren</label>
                <input id="a-tags" type="text" className={styles.input} placeholder="Ej: cumples, sin TACC, budines" />
              </div>
            </>
          ) : null}

          {paso === 2 ? (
            <>
              <p>Hasta 6 fotos. La primera es la portada. Se achican solas antes de subirse para que la página cargue rápido.</p>
              <label htmlFor="a-fotos" className={styles.dropzone}>
                <svg aria-hidden="true" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <circle cx="9" cy="11" r="2" />
                  <path d="M21 17l-5-5-8 8" />
                </svg>
                <strong>Elegí fotos de tu celu</strong>
                <span className={styles.muted}>o arrastralas acá</span>
              </label>
              <input id="a-fotos" type="file" accept="image/*" multiple className={styles.srOnly} />
              <div className={styles.slots}>
                <div className={styles.slot} style={{ background: "linear-gradient(135deg, #FFD7C9, #FF6437)" }}>
                  <span className={styles.slotTag}>Portada</span>
                </div>
                <div className={styles.slot} style={{ background: "linear-gradient(135deg, #F9C6E6, #F656BF)" }} />
                <div className={styles.slot} style={{ background: "linear-gradient(135deg, #FAF26F, #FFB98A)" }} />
                <div className={`${styles.slot} ${styles.slotEmpty}`} />
                <div className={`${styles.slot} ${styles.slotEmpty}`} />
                <div className={`${styles.slot} ${styles.slotEmpty}`} />
              </div>
            </>
          ) : null}

          {paso === 3 ? (
            <>
              <div className={styles.field}>
                <label htmlFor="a-hor" className={styles.label}>Horarios</label>
                <input id="a-hor" type="text" className={styles.input} placeholder="Ej: lun a sáb, 9 a 19 h" />
              </div>
              <fieldset className={styles.fieldset}>
                <legend>Cómo entregás o atendés</legend>
                {["Retiro en mi casa", "Envío en el barrio", "Voy a domicilio", "Online"].map((o) => (
                  <label key={o} className={styles.checkPill}><input type="checkbox" /> {o}</label>
                ))}
              </fieldset>
              <fieldset className={styles.fieldset}>
                <legend>Formas de pago</legend>
                {["Efectivo", "Transferencia", "Mercado Pago", "Tarjeta"].map((o) => (
                  <label key={o} className={styles.checkPill}><input type="checkbox" /> {o}</label>
                ))}
              </fieldset>
              <div className={styles.field}>
                <label htmlFor="a-wa" className={styles.label}>WhatsApp para que te escriban</label>
                <input id="a-wa" type="tel" inputMode="tel" className={styles.input} placeholder="351 …" />
              </div>
              <div className={styles.field}>
                <label htmlFor="a-ig" className={styles.label}>Instagram (opcional)</label>
                <input id="a-ig" type="text" className={styles.input} placeholder="@tuemprendimiento" />
              </div>
            </>
          ) : null}

          {paso === 4 ? (
            <>
              <p>Tu mail es tu llave: con él entrás a editar tu ficha, sin contraseñas. Te mandamos un código.</p>
              <div className={styles.field}>
                <label htmlFor="a-mail" className={styles.label}>Tu mail</label>
                <input id="a-mail" type="email" inputMode="email" autoComplete="email" className={styles.input} placeholder="vos@mail.com" />
              </div>
              <div className={styles.field}>
                <label htmlFor="a-cod" className={styles.label}>Código que te llegó</label>
                <input id="a-cod" type="text" inputMode="numeric" autoComplete="one-time-code" className={`${styles.input} ${styles.code}`} placeholder="000000" maxLength={6} />
              </div>
              <div className={styles.subBox}>
                <strong>Tu dirección en el barrio</strong>
                <div className={styles.twoCols}>
                  <div className={styles.field}>
                    <label htmlFor="a-mz" className={styles.label}>Manzana</label>
                    <select id="a-mz" className={styles.input} defaultValue="">
                      <option value="" disabled>Elegí</option>
                      {MANZANAS.map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="a-lote" className={styles.label}>Lote</label>
                    <select id="a-lote" className={styles.input} defaultValue="">
                      <option value="" disabled>Elegí</option>
                      {LOTES.map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className={styles.muted}>Solo se aceptan direcciones del plano del barrio. En tu ficha se muestra únicamente la manzana; el lote no se publica.</p>
              </div>
              <label className={styles.checkLine}>
                <input type="checkbox" /> Vivo en el barrio y acepto las reglas del directorio. Mis datos se usan solo para mostrar mi ficha.
              </label>
            </>
          ) : null}

          {terminado ? (
            <div className={styles.done}>
              <div className={`${styles.doneFace} ${styles.pixel}`} aria-hidden="true">(^_^)</div>
              <h1 className={styles.formTitle}>Ya estás en el directorio</h1>
              <p style={{ maxWidth: 460 }}>
                Tu ficha está publicada. Una vez por mes te llega un mail para confirmar que seguís activa: tocás un botón y listo.
              </p>
              <Link href="/barrio/ficha/tortas-de-la-flor" className={styles.btnDark} style={{ minHeight: 48, padding: "0 22px" }}>
                Ver mi ficha
              </Link>
              <Link href="/barrio/panel" style={{ fontWeight: 700, minHeight: 44, display: "flex", alignItems: "center" }}>
                Ir a mi panel
              </Link>
            </div>
          ) : (
            <div className={styles.formNav}>
              <button type="button" className={styles.btnOutline} disabled={paso === 1} onClick={() => setPaso((p) => Math.max(1, p - 1))}>
                Atrás
              </button>
              <button type="button" className={styles.btnCoral} onClick={() => setPaso((p) => p + 1)}>
                {paso === 4 ? "Publicar mi ficha" : "Seguir"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
