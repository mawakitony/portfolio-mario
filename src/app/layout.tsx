import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { cn } from "@/lib/utils";

const poppins = Poppins({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MARDIGITAL",
    template: "%s — MARDIGITAL",
  },
  description:
    "MARDIGITAL AGENCE, direction créative d'Amevor Kossi Mario. Branding, design graphique, image en mouvement, production vidéo, photographie, live streaming et formation. Togo.",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "MARDIGITAL",
    title: "MARDIGITAL",
    description:
      "Agence de direction créative dirigée par Amevor Kossi Mario. The Brand World.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={cn("dark", poppins.variable, poppins.className)}>
      <body>
        <Script id="js-flag" strategy="beforeInteractive">
          {"document.documentElement.classList.add('js')"}
        </Script>
        {children}
      </body>
    </html>
  );
}
