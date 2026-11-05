import { CopyrightYear } from "@/components/site/copyright-year";
import { MotionReveal } from "@/components/site/motion/motion-reveal";
import { SectionLink } from "@/components/site/section-link";
import { SocialLinks } from "@/components/site/social-links";
import { siteSections } from "@/components/site/sections";
import type { SiteContent } from "@/lib/content/settings";

export function SiteFooter({ site }: { site: SiteContent }) {
  return (
    <footer className="relative border-t border-[#2078CF]/25 bg-gradient-to-b from-[#020C47] to-[#000521]">
      <div className="pointer-events-none absolute inset-x-0 -top-16 h-16 bg-gradient-to-b from-transparent to-[#020C47]" aria-hidden />
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-6 py-20 md:grid-cols-[1.4fr_1fr_1fr] md:px-10">
        <MotionReveal variant="fadeScale">
          <p className="font-display text-5xl tracking-tight text-white">{site.name}</p>
          <p className="mt-2 text-sm font-medium tracking-[0.18em] text-[#2078CF] uppercase">{site.signature}</p>
          <p className="mt-3 max-w-sm text-sm text-[#b7c4de]">
            {site.legalName}. Direction créative d&apos;{site.director}.
          </p>
          <SocialLinks links={site.social} className="mt-6 flex flex-wrap gap-3" />
        </MotionReveal>
        <nav aria-label="Pied de page">
          <MotionReveal variant="fadeScale" delay={0.08}>
            <p className="text-xs font-medium tracking-[0.18em] text-[#b7c4de] uppercase">Navigation</p>
          </MotionReveal>
          <ul className="mt-4 grid gap-2 text-sm">
            {siteSections.map((section, index) => (
              <MotionReveal key={section.id} as="li" variant="staggerDropDown" delay={index * 0.08}>
                <SectionLink id={section.id} className="nav-link text-[#b7c4de] hover:text-white">
                  {section.label}
                </SectionLink>
              </MotionReveal>
            ))}
          </ul>
        </nav>
        <MotionReveal variant="fadeScale" delay={0.12} className="text-sm text-[#b7c4de] not-italic" as="div">
        <address className="text-sm text-[#b7c4de] not-italic">
          <p className="text-xs font-medium tracking-[0.18em] uppercase">Contact</p>
          <p className="mt-4">{site.location}</p>
          {site.phones.map((phone) => (
            <p key={phone.href} className="mt-2">
              <a href={phone.href} className="nav-link hover:text-white">
                {phone.display}
              </a>
            </p>
          ))}
          <p className="mt-2">
            <a href={`mailto:${site.email}`} className="nav-link hover:text-white">
              {site.email}
            </a>
          </p>
        </address>
        </MotionReveal>
      </div>
      <MotionReveal variant="fadeScale" className="border-t border-[#2078CF]/20 px-6 py-5 text-center text-xs text-[#b7c4de] md:px-10">
        © <CopyrightYear /> {site.legalName}. {site.signature}.
      </MotionReveal>
    </footer>
  );
}
