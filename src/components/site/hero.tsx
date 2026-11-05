"use client";

import { ChevronDown } from "lucide-react";
import { useState, type PointerEvent } from "react";
import { SectionLink } from "@/components/site/section-link";
import { AnimatedCounter } from "@/components/site/motion/animated-counter";
import { motionPresets } from "@/components/site/motion/config";
import { MagneticButton } from "@/components/site/motion/magnetic-button";
import { MotionReveal } from "@/components/site/motion/motion-reveal";
import { RevealOnScroll } from "@/components/site/motion/reveal-on-scroll";
import { TypewriterText } from "@/components/site/motion/typewriter-text";

export function Hero({
  name,
  signature,
  legalName,
  director,
  promise,
  publishedCount,
}: {
  name: string;
  signature: string;
  legalName: string;
  director: string;
  promise: string;
  publishedCount: number;
}) {
  const [shift, setShift] = useState({ x: 0, y: 0 });

  function onMove(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== "mouse" || window.innerWidth < 768) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setShift({
      x: ((event.clientX - rect.left) / rect.width - 0.5) * 24,
      y: ((event.clientY - rect.top) / rect.height - 0.5) * 16,
    });
  }

  return (
    <section
      id="accueil"
      onPointerMove={onMove}
      className="grain scroll-mt-24 relative isolate flex min-h-[calc(100svh-4rem)] items-end overflow-hidden"
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{ transform: `translate3d(${shift.x}px, ${shift.y}px, 0)` }}
      >
        <div className="drift absolute -top-32 right-[-12%] h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,#2078CF55,transparent_68%)]" />
        <div className="absolute bottom-[-18%] left-[-10%] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,#0E4EB240,transparent_70%)]" />
        <MotionReveal variant="zoomOut" onScroll={false} delay={0.2} className="absolute top-24 left-8 hidden md:block">
        <svg className="tilt-soft h-40 w-40 text-[#2078CF]/40" viewBox="0 0 160 160" fill="none">
          <circle cx="80" cy="80" r="62" stroke="currentColor" strokeWidth="1" />
          <path d="M20 96h120M40 28l80 104" stroke="currentColor" strokeWidth="1" />
        </svg>
        </MotionReveal>
      </div>
      <div className="relative mx-auto flex w-full max-w-7xl flex-col px-6 pt-16 pb-24 md:px-10 md:pb-28">
        <RevealOnScroll variant="fadeScale" motion={{ ...motionPresets.fade, delay: 200, onScroll: false }}>
          <p className="text-xs font-medium tracking-[0.32em] text-[#2078CF] uppercase">{legalName}</p>
        </RevealOnScroll>
        <h1 className="relative mt-6 max-w-full text-white">
          <MotionReveal
            as="span"
            variant="pageLoad"
            onScroll={false}
            delay={0.12}
            className="pointer-events-none absolute -inset-x-8 -top-8 bottom-0 bg-[radial-gradient(ellipse_at_left,rgba(32,120,207,0.4),transparent_68%)]"
          />
          <span className="relative">
            <TypewriterText
              lines={[
                {
                  text: name,
                  duration: 1400,
                  color: "#ffffff",
                  className:
                    "font-display text-[clamp(2.2rem,12vw,8.5rem)] leading-[0.86] whitespace-nowrap text-white uppercase",
                },
                {
                  text: signature,
                  duration: 1600,
                  color: "rgba(255,255,255,0.92)",
                  className:
                    "mt-3 text-[clamp(1.35rem,4.2vw,3.25rem)] leading-tight font-semibold tracking-[-0.03em] text-white/90",
                },
              ]}
            />
          </span>
        </h1>
        <div className="mt-10 flex max-w-5xl flex-col justify-between gap-8 md:flex-row md:items-end">
          <RevealOnScroll motion={{ ...motionPresets.fade, delay: 280, onScroll: false }}>
            <div className="grid max-w-md gap-5">
              <p className="text-lg font-medium text-[#b7c4de]">
                Direction créative d&apos;{director}. {promise}
              </p>
              {publishedCount > 0 ? <AnimatedCounter value={publishedCount} label="créations publiées" /> : null}
            </div>
          </RevealOnScroll>
          <RevealOnScroll variant="popUp" motion={{ ...motionPresets.fade, delay: 3200, onScroll: false }}>
            <MagneticButton>
              <SectionLink
                id="images"
                className="inline-flex rounded-full bg-[#2078CF] px-5 py-3 text-sm font-semibold text-white transition-transform duration-300 hover:bg-[#0E4EB2] motion-safe:hover:scale-[1.03]"
              >
                Explorer nos créations
              </SectionLink>
            </MagneticButton>
          </RevealOnScroll>
        </div>
      </div>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <MotionReveal variant="popUp" onScroll={false} delay={3.7}>
        <SectionLink
          id="images"
          className="grid size-12 place-items-center rounded-full border border-[#2078CF]/50 text-white shadow-[0_0_18px_rgba(32,120,207,0.35)] transition-transform duration-300 motion-safe:hover:-translate-y-1 motion-safe:hover:border-[#2078CF] motion-safe:hover:shadow-[0_0_24px_rgba(32,120,207,0.55)]"
        >
          <ChevronDown className="scroll-cue size-6" aria-hidden />
          <span className="sr-only">Descendre vers Images / Affiches</span>
        </SectionLink>
        </MotionReveal>
      </div>
    </section>
  );
}
