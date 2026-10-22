import Link from "next/link";
import ProposalForm from "@/components/proposals/ProposalForm";
import styles from "../page.module.css";

export default function NuevaPropuestaPage() {
  return (
    <section className={styles.card}>
      <div className={styles.toolbar}>
        <h2>Nueva propuesta</h2>
        <Link href="/app/propuestas" className={styles.link}>
          ← Volver
        </Link>
      </div>
      <ProposalForm />
    </section>
  );
}
