"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import StatusBadge from "./StatusBadge";
import styles from "./Nav.module.css";

const LOGO_SRC = "/assets/logos/(a)%20Ailen_logo%20secundario.svg";

const LINKS = [
  { href: "/sistema", label: "SISTEMA" },
  { href: "/test", label: "TEST" },
  { href: "/builder", label: "BUILDER" },
  { href: "/contacto", label: "CONTACTO" },
] as const;

export default function Nav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 640) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand} onClick={() => setOpen(false)}>
        <img
          src={LOGO_SRC}
          alt="Ailén Sampó"
          className={styles.brandLogo}
          width={160}
          height={44}
        />
      </Link>

      <nav id="main-nav" className={styles.nav} aria-label="Principal">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className={styles.navLink}>
            {link.label}
          </Link>
        ))}
      </nav>

      <StatusBadge variant="header" className={styles.status} />

      <button
        type="button"
        className={styles.menuBtn}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((prev) => !prev)}
      >
        {open ? "CERRAR" : "MENÚ"}
      </button>

      <div
        id="mobile-menu"
        className={`${styles.menuFull} ${open ? styles.menuFullOpen : ""}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        aria-label="Navegación"
      >
        <div className={styles.menuFullGrid} aria-hidden="true" />
        <nav className={styles.menuFullNav} aria-label="Menú mobile">
          {LINKS.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              className={styles.menuFullLink}
              style={{ transitionDelay: open ? `${index * 60 + 80}ms` : "0ms" }}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
