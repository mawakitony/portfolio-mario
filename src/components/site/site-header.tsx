"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { MotionReveal } from "@/components/site/motion/motion-reveal";
import { SectionLink } from "@/components/site/section-link";
import { siteSections } from "@/components/site/sections";
import { cn } from "@/lib/utils";

export function SiteHeader({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("accueil");
  const [scrolled, setScrolled] = useState(false);
  const panelId = useId();

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    const frame = window.requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (pathname !== "/") return;
    const nodes = siteSections
      .map((section) => document.getElementById(section.id))
      .filter((node): node is HTMLElement => Boolean(node));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0.15, 0.35] },
    );
    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <MotionReveal
      as="header"
      variant="pageLoad"
      onScroll={false}
      className={cn(
        "fixed inset-x-0 top-0 z-40 border-b transition-colors duration-300",
        open || scrolled
          ? "border-[#2078CF]/25 bg-[#020C47]/95"
          : "border-[#2078CF]/15 bg-[#000521]/80 md:border-transparent md:bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 md:px-10">
        <SectionLink
          id="accueil"
          onNavigate={closeMenu}
          className="min-w-0 truncate text-sm font-semibold tracking-[0.18em] text-white uppercase"
        >
          {logoUrl ? (
            <Image src={logoUrl} alt={name} width={160} height={48} className="h-8 w-auto max-w-[9.5rem] object-contain object-left" />
          ) : (
            name
          )}
        </SectionLink>
        <nav aria-label="Navigation principale" className="hidden items-center gap-6 md:flex">
          {siteSections.map((section, index) => (
            <MotionReveal key={section.id} as="span" variant="staggerDropDown" onScroll={false} delay={0.15 + index * 0.09}>
              <SectionLink
                id={section.id}
                current={pathname === "/" && active === section.id}
                className={cn(
                  "nav-link text-sm font-medium text-muted-foreground hover:text-foreground",
                  pathname === "/" && active === section.id && "text-foreground",
                )}
              >
                {section.label}
              </SectionLink>
            </MotionReveal>
          ))}
          <SectionLink
            id="contact"
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Collaborer
          </SectionLink>
        </nav>
        <button
          type="button"
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-[#2078CF]/40 bg-[#011F65] px-3 text-sm font-medium text-white md:hidden"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="size-4" aria-hidden /> : <Menu className="size-4" aria-hidden />}
          {open ? "Fermer" : "Menu"}
        </button>
      </div>
      {open ? (
        <nav
          id={panelId}
          aria-label="Navigation mobile"
          className="fixed inset-x-0 top-16 bottom-0 overflow-y-auto border-t border-[#2078CF]/20 bg-[#000521] px-4 py-4 md:hidden"
        >
          <ul className="grid">
            {siteSections.map((section, index) => (
              <MotionReveal key={section.id} as="li" variant="staggerDropDown" onScroll={false} delay={index * 0.08} className="border-b border-[#2078CF]/15">
                <SectionLink
                  id={section.id}
                  onNavigate={closeMenu}
                  current={pathname === "/" && active === section.id}
                  className="block py-4 font-display text-[1.75rem] leading-none break-words text-white"
                >
                  {section.label}
                </SectionLink>
              </MotionReveal>
            ))}
          </ul>
        </nav>
      ) : null}
    </MotionReveal>
  );
}
