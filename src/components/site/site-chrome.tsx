"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { SectionLink } from "@/components/site/section-link";

export function SiteChrome() {
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    function onScroll() {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(height > 0 ? Math.min(1, window.scrollY / height) : 0);
      setShowTop(window.scrollY > window.innerHeight * 0.85);
    }
    const frame = window.requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5" aria-hidden>
        <div className="h-full origin-left bg-[#2078CF]" style={{ transform: `scaleX(${progress})` }} />
      </div>
      {showTop ? (
        <SectionLink
          id="accueil"
          className="fixed right-4 bottom-4 z-40 grid size-11 place-items-center rounded-full bg-[#2078CF] text-white shadow-lg transition-transform duration-300 motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-105 md:right-6 md:bottom-6"
        >
          <ArrowUp className="size-5" aria-hidden />
          <span className="sr-only">Retour en haut</span>
        </SectionLink>
      ) : null}
    </>
  );
}
