"use client";

import { useCallback, useState } from "react";
import { WHATSAPP_URL } from "@/lib/contacto";
import BugReport from "./BugReport";
import styles from "./ContactSection.module.css";

// Acciones visibles de Contacto (el mockup no las tiene; sin ellas no había nada que hacer acá).
export default function ContactActions() {
  const [bugOpen, setBugOpen] = useState(false);
  const close = useCallback(() => setBugOpen(false), []);

  return (
    <div className={styles.actions}>
      <a className={styles.audioBtn} href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
        <span aria-hidden="true">🎙️</span> Mandar audio
      </a>
      <button type="button" className={styles.bugLink} onClick={() => setBugOpen(true)}>
        ¿Sin WhatsApp? Reportá un bug de tu negocio <span aria-hidden="true">⚠</span>
      </button>
      <BugReport open={bugOpen} onClose={close} />
    </div>
  );
}
