import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { ContactForm } from "@/components/site/contact-form";
import { Hero } from "@/components/site/hero";
import { ImageBoard } from "@/components/site/image-board";
import { motionPresets } from "@/components/site/motion/config";
import { MotionReveal } from "@/components/site/motion/motion-reveal";
import { ParallaxMedia } from "@/components/site/motion/parallax-media";
import { RevealOnScroll } from "@/components/site/motion/reveal-on-scroll";
import { ExpertiseStrip, ServiceBoard } from "@/components/site/service-board";
import { VideoBand } from "@/components/site/video-band";
import { agency } from "@/lib/content/agency";
import { getSiteContent } from "@/lib/content/settings";
import { imageCardsFrom } from "@/lib/portfolio/image-cards";
import { getPublishedProjects, getPublishedServices, videosOf } from "@/lib/portfolio/queries";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteContent();
  return {
    title: { absolute: site.seoTitle },
    description: site.seoDescription,
  };
}

export default function HomePage() {
  return (
    <Suspense fallback={<p className="px-6 py-24 text-sm text-muted-foreground">Chargement…</p>}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  const [projectsResult, servicesResult, site] = await Promise.all([
    getPublishedProjects(),
    getPublishedServices(),
    getSiteContent(),
  ]);
  const projects = projectsResult.ok ? projectsResult.data : [];
  const videos = projects.flatMap((project) => videosOf(project).map((media) => ({ project, media })));
  const images = imageCardsFrom(projects);
  const publishedServices = servicesResult.ok ? servicesResult.data : [];
  const services = publishedServices.length > 0 ? publishedServices : [...agency.services];

  return (
    <main>
      <Hero
        name={site.name}
        signature={site.signature}
        legalName={site.legalName}
        director={site.director}
        promise={site.promise}
        publishedCount={images.length + videos.length}
      />

      <section id="images" className="scroll-mt-24 border-t border-border">
        <span id="realisations" className="block scroll-mt-24" />
        <div className="mx-auto w-full max-w-7xl px-6 py-20 md:px-10">
          <div className="mx-auto max-w-2xl text-center">
            <RevealOnScroll motion={motionPresets.rise}>
              <h2 className="font-display text-5xl md:text-7xl">Images / Affiches</h2>
            </RevealOnScroll>
            <RevealOnScroll motion={{ ...motionPresets.fade, delay: 80 }}>
              <p className="mt-4 text-muted-foreground">
                Images, affiches, cartes de visite et autres créations publiées.
              </p>
            </RevealOnScroll>
          </div>
          <div className="mt-12">
            <ImageBoard cards={images} unavailable={!projectsResult.ok} preview />
          </div>
        </div>
      </section>

      <section id="videos" className="scroll-mt-24 overflow-hidden border-t border-border">
        <div className="mx-auto w-full max-w-7xl px-6 py-20 md:px-10">
          <div className="mx-auto max-w-2xl text-center">
            <RevealOnScroll motion={motionPresets.fade}>
              <p className="flex items-center justify-center gap-3 text-xs font-medium tracking-[0.22em] text-muted-foreground uppercase">
                <span className="h-px w-8 bg-brand" />
                03 / Image en mouvement
              </p>
            </RevealOnScroll>
            <RevealOnScroll motion={{ ...motionPresets.rise, delay: 60 }}>
              <h2 className="mt-5 font-display text-5xl md:text-6xl">Vidéos</h2>
            </RevealOnScroll>
            <RevealOnScroll motion={{ ...motionPresets.fade, delay: 120 }}>
              <p className="mt-4 text-muted-foreground">
                Les vidéos publiées. La lecture démarre uniquement au clic.
              </p>
            </RevealOnScroll>
          </div>
          <div className="mt-12">
            <VideoBand entries={videos} unavailable={!projectsResult.ok} />
          </div>
        </div>
      </section>

      <section id="services" className="scroll-mt-24 border-t border-border">
        <div className="mx-auto w-full max-w-7xl px-6 py-20 md:px-10">
          <div>
            <RevealOnScroll motion={motionPresets.fade}>
              <p className="text-xs font-medium tracking-[0.22em] text-muted-foreground uppercase">Offre</p>
            </RevealOnScroll>
            <RevealOnScroll motion={{ ...motionPresets.rise, delay: 60 }}>
              <h2 className="mt-4 font-display text-5xl md:text-7xl">Services</h2>
            </RevealOnScroll>
          </div>
          <ServiceBoard
            services={services.map((service) => ({
              key: "id" in service ? service.id : service.slug,
              slug: service.slug,
              title: service.title,
              summary: service.summary,
            }))}
          />
        </div>
      </section>

      <section id="apropos" className="scroll-mt-24 border-t border-[#2078CF]/20">
        <div className="mx-auto w-full max-w-7xl px-6 py-24 md:px-10">
          <div className="grid gap-14 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:items-start">
            <ParallaxMedia>
              <MotionReveal variant="zoomOut" className="overflow-hidden rounded-[1.4rem]">
                {site.portraitUrl ? (
                  <Image
                    src={site.portraitUrl}
                    alt={site.director}
                    width={900}
                    height={1120}
                    className="aspect-[4/5] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[4/5] items-end border border-[#2078CF]/30 bg-gradient-to-br from-[#011F65] to-[#020C47] p-8">
                    <p className="font-display text-5xl text-white">{site.director}</p>
                  </div>
                )}
              </MotionReveal>
            </ParallaxMedia>
            <div>
              <RevealOnScroll motion={motionPresets.fade}>
                <p className="text-xs font-medium tracking-[0.22em] text-[#2078CF] uppercase">{site.role}</p>
              </RevealOnScroll>
              <RevealOnScroll motion={{ ...motionPresets.rise, delay: 60 }}>
                <h2 className="mt-4 max-w-3xl font-display text-5xl text-white md:text-7xl">{site.director}</h2>
              </RevealOnScroll>
              <RevealOnScroll motion={{ ...motionPresets.fade, delay: 100 }}>
                <p className="mt-4 text-sm font-medium text-[#b7c4de]">{site.legalName}</p>
              </RevealOnScroll>
              <div className="mt-8 grid max-w-2xl gap-6">
                {readingParagraphs(site.about).map((paragraph, index) => (
                  <RevealOnScroll key={paragraph} motion={{ ...motionPresets.fade, delay: index * 70 }}>
                    <p className="text-base leading-8 text-[#d5deef] md:text-lg">{paragraph}</p>
                  </RevealOnScroll>
                ))}
              </div>
              <RevealOnScroll motion={{ ...motionPresets.rise, delay: 80 }}>
                <blockquote className="mt-10 max-w-3xl border-l-2 border-[#2078CF] pl-6">
                  <p className="font-display text-3xl leading-[1.15] text-balance text-white md:text-5xl">{site.promise}</p>
                </blockquote>
              </RevealOnScroll>
            </div>
          </div>
          <ExpertiseStrip
            services={services.map((service) => ({
              key: "id" in service ? service.id : service.slug,
              slug: service.slug,
              title: service.title,
              summary: service.summary,
            }))}
          />
        </div>
      </section>

      <section id="contact" className="scroll-mt-24 border-t border-border">
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-6 py-20 md:grid-cols-[0.8fr_1.2fr] md:px-10">
          <RevealOnScroll motion={motionPresets.rise}>
            <p className="text-xs font-medium tracking-[0.22em] text-muted-foreground uppercase">Contact</p>
            <h2 className="mt-4 font-display text-5xl md:text-7xl">Parlons du projet.</h2>
            <address className="mt-8 grid gap-2 text-sm text-muted-foreground not-italic">
              <p>{site.legalName}</p>
              <p>{site.location}</p>
              {site.phones.map((phone) => (
                <a key={phone.href} href={phone.href} className="nav-link w-fit hover:text-foreground">
                  {phone.display}
                </a>
              ))}
              <a href={`mailto:${site.email}`} className="nav-link w-fit hover:text-foreground">
                {site.email}
              </a>
            </address>
          </RevealOnScroll>
          <RevealOnScroll motion={{ ...motionPresets.fade, delay: 80 }}>
            <ContactForm />
          </RevealOnScroll>
        </div>
      </section>
    </main>
  );
}

function readingParagraphs(paragraphs: string[]) {
  return paragraphs.flatMap((paragraph) => {
    const parts = paragraph
      .split(/\n+/)
      .map((part) => part.trim())
      .filter(Boolean);
    return parts.flatMap((part) => {
      const sentences = part.split(/(?<=[.!?])\s+/).filter(Boolean);
      if (sentences.length <= 2) return [part];
      const groups: string[] = [];
      for (let index = 0; index < sentences.length; index += 2) {
        groups.push(sentences.slice(index, index + 2).join(" "));
      }
      return groups;
    });
  });
}
