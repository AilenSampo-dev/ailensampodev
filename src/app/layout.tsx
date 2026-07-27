import type { Metadata } from "next";
import Script from "next/script";
import "@/styles/globals.css";
import styles from "./layout.module.css";

export const metadata: Metadata = {
  title: "Ailen Sampó — Sistemas a Medida",
  description: "Sistemas digitales a medida.",
  metadataBase: new URL("https://ailensampo.com"),
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Ailen Sampó",
    url: "https://ailensampo.com/",
    title: "Ailen Sampó — Sistemas a Medida",
    description: "Sistemas digitales a medida.",
    images: [
      {
        url: "/assets/recursos-graficos/og_dino.png",
        width: 1200,
        height: 630,
        alt: "Dino de Ailen Sampó",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ailen Sampó — Sistemas a Medida",
    description: "Sistemas digitales a medida.",
    images: ["/assets/recursos-graficos/og_dino.png"],
  },
  icons: {
    icon: "/favicon.svg",
    other: [
      {
        rel: "mask-icon",
        url: "/favicon.svg",
        color: "#F656BF",
      },
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

const GA_ID = "G-RXWX4CDK0C";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={styles.body}>{children}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
      </body>
    </html>
  );
}
