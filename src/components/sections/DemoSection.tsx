"use client";

import { FormEvent, useState } from "react";
import { DemoFaceNeutral, DemoFaceWink } from "./DemoFaces";
import SectionTag from "./SectionTag";
import { sectionProps } from "./sections";
import styles from "./DemoSection.module.css";

const TAGS = [
  "Respuestas infinitas",
  "Clientes que se pierden",
  "Plantillas que nadie ve",
  "Reuniones sin control",
  "Cobros que demoran",
] as const;

type DemoSectionProps = {
  onGenerate: (task: string) => void;
};

export default function DemoSection({ onGenerate }: DemoSectionProps) {
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);

  const showCursor = !input && !focused;

  function submit(value = input) {
    onGenerate(value);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit();
  }

  return (
    <section className={styles.section} {...sectionProps("demo")}>
      <SectionTag section="demo" tone="light" />

      <DemoFaceWink className={styles.faceLeft} />
      <DemoFaceNeutral className={styles.faceRight} />

      <div className={styles.inner}>
        <p className={styles.eyebrow}>No te explico lo que hago</p>
        <h2 className={styles.title}>Te lo demuestro</h2>

        <form className={styles.card} onSubmit={handleSubmit}>
          <div className={styles.bannerWrap}>
            <div className={styles.banner}>
              <p className={styles.bannerText}>¿Qué tarea te está robando tiempo hoy?</p>
              <span className={styles.palitoLeft} aria-hidden="true">
                <span className={styles.palitoDot} />
                <span className={styles.palitoLine} />
              </span>
              <span className={styles.palitoRight} aria-hidden="true">
                <span className={styles.palitoLine} />
                <span className={styles.palitoDot} />
              </span>
            </div>
          </div>

          <div className={styles.formFields}>
            <label className={styles.inputWrap}>
              <span className="sr-only">Describí la tarea</span>
              {showCursor ? <span className={`${styles.inputCursor} anim-cursor-blink`} aria-hidden="true" /> : null}
              <input
                type="text"
                className={`${styles.input} ${showCursor ? styles.inputWaiting : ""}`}
                placeholder="Iniciá su desacargo aquí"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
            </label>

            <button type="submit" className={styles.submit}>
              Generar sistema
            </button>
          </div>
        </form>

        <div className={styles.tagsWrap}>
          <div className={styles.tags} role="list">
            {TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                className={styles.tag}
                role="listitem"
                onClick={() => {
                  setInput(tag);
                  submit(tag);
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
