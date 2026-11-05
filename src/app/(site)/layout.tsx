import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteChrome } from "@/components/site/site-chrome";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { getSiteContent } from "@/lib/content/settings";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteContent();
  return {
    title: { default: site.seoTitle, template: `%s — ${site.name}` },
    description: site.seoDescription,
    openGraph: {
      siteName: site.name,
      title: site.seoTitle,
      description: site.seoDescription,
    },
  };
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const site = await getSiteContent();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: site.legalName,
    url: siteUrl,
    email: site.email,
    telephone: site.phones[0]?.href.replace("tel:", ""),
    areaServed: site.location,
    address: {
      "@type": "PostalAddress",
      addressCountry: site.countryCode,
    },
    founder: {
      "@type": "Person",
      name: site.director,
      jobTitle: site.role,
    },
  };
  return (
    <div className="studio page-load min-h-svh overflow-x-hidden">
      <SiteChrome />
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-background focus:px-3 focus:py-2"
      >
        Aller au contenu
      </a>
      <Suspense fallback={<div className="h-16 border-b border-border" />}>
        <SiteHeader name={site.name} logoUrl={site.logoUrl} />
      </Suspense>
      <div id="contenu" className="pt-16">
        {children}
      </div>
      <SiteFooter site={site} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
