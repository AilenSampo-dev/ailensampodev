import Nav from "@/components/layout/Nav";
import styles from "./layout.module.css";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Nav />
      <div className={styles.content}>{children}</div>
    </>
  );
}
