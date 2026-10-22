import Link from "next/link";
import styles from "./Footer.module.css";

// Footer — réplica de la banda inferior de Canva DAHM0M2xh8E pág. 6. Mismos enlaces que el header (Nav).
const LINKS = [
  { href: "/#sistema", label: "Sistema" },
  { href: "/#demo", label: "Demo" },
  { href: "/#caos", label: "Caos" },
  { href: "/#contacto", label: "Contacto" },
] as const;

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <Link href="/" className={styles.brand} aria-label="Ailén Sampó — inicio">
        <span className={styles.logo} aria-hidden="true" />
      </Link>

      <nav className={styles.nav} aria-label="Pie de página">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className={styles.link}>
            {link.label}
          </Link>
        ))}
      </nav>

      <p className={styles.status}>
        <span className={styles.dot} aria-hidden="true" />
        Disponible para nuevos proyectos
      </p>
    </footer>
  );
}
