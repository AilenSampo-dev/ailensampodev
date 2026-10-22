"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import styles from "./BugReport.module.css";

// "Reportá un bug de tu negocio": ventana de error pixel. El reporte entra como lead (Neon → ERP).

type Props = {
  open: boolean;
  onClose: () => void;
};

type State = "idle" | "sending" | "ok" | "error";

export default function BugReport({ open, onClose }: Props) {
  const [mensaje, setMensaje] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const firstField = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    firstField.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) setState((current) => (current === "ok" ? "idle" : current));
  }, [open]);

  if (!open) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (state === "sending") return;
    setState("sending");
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, mensaje, origen: "bug" }),
      });
      if (response.ok) {
        setState("ok");
        setMensaje("");
        setEmail("");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.window}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bug-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.bar}>
          <span className={styles.dots} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <p id="bug-title">error.exe — reportá un bug de tu negocio</p>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        {state === "ok" ? (
          <div className={styles.body}>
            <p className={styles.code}>&gt; reporte recibido ✓</p>
            <p className={styles.lead}>Ya lo tengo. Lo leo y te escribo para ver cómo se arregla.</p>
            <button type="button" className={styles.submit} onClick={onClose}>
              Cerrar
            </button>
          </div>
        ) : (
          <form className={styles.body} onSubmit={handleSubmit}>
            <div className={styles.head}>
              <img src="/assets/recursos-graficos/important.svg" alt="" width={64} height={64} />
              <p className={styles.lead}>
                Algo en tu negocio no funciona como debería.
                <br />
                Contame qué se rompe; el diagnóstico corre por mi cuenta.
              </p>
            </div>

            <label className={styles.label} htmlFor="bug-mensaje">
              &gt; ¿Qué se rompe?
            </label>
            <textarea
              id="bug-mensaje"
              ref={firstField}
              className={styles.field}
              rows={4}
              maxLength={600}
              placeholder="Ej: los turnos los anoto en un cuaderno y se me pisan; cobro por transferencia y no sé quién pagó…"
              value={mensaje}
              onChange={(event) => setMensaje(event.target.value)}
              required
            />

            <label className={styles.label} htmlFor="bug-email">
              &gt; ¿Dónde te contesto?
            </label>
            <input
              id="bug-email"
              className={styles.field}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="tumail@gmail.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <button type="submit" className={styles.submit} disabled={state === "sending"}>
              {state === "sending" ? "Enviando…" : "Enviar reporte"}
            </button>
            <p className={styles.privacy}>
              {state === "error"
                ? "No se pudo enviar. Probá de nuevo en un rato."
                : "Uso tus datos solo para responderte. Podés pedirme que los borre cuando quieras."}
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
