import Link from "next/link";
import styles from "./barrio.module.css";

export const NOMBRE_BARRIO = "[NOMBRE DEL BARRIO]";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={`${styles.container} ${styles.headerInner}`}>
        <Link href="/barrio" className={styles.brand}>
          <span className={`${styles.brandMark} ${styles.pixel}`} aria-hidden="true">B</span>
          Hecho en {NOMBRE_BARRIO}
        </Link>
        <nav className={styles.nav} aria-label="Directorio">
          <Link href="/barrio#rubros" className={styles.navLink}>Rubros</Link>
          <Link href="/barrio#como" className={styles.navLink}>Cómo funciona</Link>
          <Link href="/barrio/panel" className={styles.navLink}>Editar mi ficha</Link>
          <Link href="/barrio/alta" className={styles.navCta}>Sumá tu emprendimiento</Link>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`${styles.container} ${styles.footerInner}`}>
        <span>Directorio de vecinos de {NOMBRE_BARRIO}</span>
        <span>
          Sistema hecho por <a href="https://ailensampo.com" style={{ fontWeight: 800 }}>s(a) · Ailén Sampó</a>
        </span>
      </div>
    </footer>
  );
}

export function IconoWhatsApp({ size = 18 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12z" />
    </svg>
  );
}
