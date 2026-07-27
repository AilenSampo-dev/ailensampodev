"use client";

import { useState } from "react";
import styles from "./CopyProposalLink.module.css";

type Props = {
  url: string;
};

export default function CopyProposalLink({ url }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <input className={styles.input} readOnly value={url} />
      <button type="button" className={styles.btn} onClick={handleCopy}>
        {copied ? "Copiado" : "Copiar link"}
      </button>
    </div>
  );
}
