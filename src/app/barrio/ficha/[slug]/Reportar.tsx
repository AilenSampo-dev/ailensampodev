"use client";

import { useState } from "react";
import styles from "../../barrio.module.css";

export default function Reportar() {
  const [reportada, setReportada] = useState(false);

  if (reportada) {
    return <p className={styles.note}>Gracias. Si 3 vecinos la reportan, se pausa sola hasta que la emprendedora la revise.</p>;
  }
  return (
    <button type="button" className={styles.textBtn} onClick={() => setReportada(true)}>
      Reportar esta ficha
    </button>
  );
}
