import type { Metadata } from "next";
import { Cormorant_Garamond, Italianno, Montserrat } from "next/font/google";
import "./globals.css";

const displayFont = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const sansFont = Montserrat({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const scriptFont = Italianno({
  variable: "--font-script",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Diana & Erick | 9–11 de abril de 2027",
  description: "Confirma tu asistencia a la boda de Diana y Erick.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    title: "Diana & Erick | 9–11 de abril de 2027",
    description: "Confirma tu asistencia a la boda de Diana y Erick.",
    locale: "es_BO",
    type: "website",
  },
  icons: {
    icon: {
      url: "/images/footer-gallery-cutout.png",
      type: "image/png",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${displayFont.variable} ${sansFont.variable} ${scriptFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
