import Link from "next/link";
import styles from "./layout.module.css";

export default function ErpLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Panel interno</p>
        <h1 className={styles.title}>Ailen Sampó · ERP</h1>
        <nav className={styles.nav}>
          <Link href="/app/propuestas">Propuestas</Link>
          <Link href="/app/propuestas/nueva">Nueva propuesta</Link>
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}