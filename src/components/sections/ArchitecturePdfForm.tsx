"use client";

import { FormEvent, useState } from "react";
import styles from "./ArchitectureSection.module.css";

// "Recibí tu arquitectura en PDF": mail obligatorio → PDF a la clienta + copia a Ailén + lead (Neon).

type State = "idle" | "sending" | "ok" | "error";

export default function ArchitecturePdfForm({ consultaId }: { consultaId?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");

  if (!consultaId) return null; // arquitectura armada sin conexión: no hay registro para generar el PDF

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (state === "sending") return;
    setState("sending");
    try {
      const response = await fetch("/api/arquitectura/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consultaId }),
      });
      setState(response.ok ? "ok" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "ok") {
    return (
      <p className={styles.pdfOk} role="status">
        &gt; listo ✓ Te mandé tu arquitectura a <strong>{email}</strong>. Si no la ves, fijate en spam.
      </p>
    );
  }

  return (
    <form className={styles.pdfForm} onSubmit={handleSubmit}>
      <label htmlFor="pdf-email" className={styles.pdfLabel}>
        Recibí tu arquitectura en PDF
      </label>
      <div className={styles.pdfRow}>
        <input
          id="pdf-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="tumail@gmail.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <button type="submit" disabled={state === "sending"}>
          {state === "sending" ? "Enviando…" : "Enviarme el PDF"}
        </button>
      </div>
      <p className={styles.pdfPrivacy}>
        {state === "error"
          ? "No se pudo enviar. Probá de nuevo en un rato o mandame un audio."
          : "Uso tu mail solo para mandarte esto y responderte. Podés pedirme que lo borre cuando quieras."}
      </p>
    </form>
  );
}
