"use client";

import { ChevronDown } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, useState, type PointerEvent } from "react";
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
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const depth = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 36]);
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
      ref={sectionRef}
      id="accueil"
      onPointerMove={onMove}
      className="grain scroll-mt-24 relative isolate flex min-h-[calc(100svh-4rem)] items-end overflow-hidden"
    >
      <motion.div className="pointer-events-none absolute inset-0" aria-hidden style={{ y: depth }}>
      <div
        className="absolute inset-0"
        style={{ transform: `translate3d(${shift.x}px, ${shift.y}px, 0)` }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_78%_26%,rgba(32,120,207,0.38),transparent_26%),radial-gradient(ellipse_at_68%_48%,rgba(14,78,178,0.22),transparent_48%),radial-gradient(ellipse_at_6%_92%,rgba(14,78,178,0.16),transparent_36%)]" />
        <FlowField paths={leftField} className="absolute top-[-2%] -left-[12%] h-[96%] w-[48%] max-w-none opacity-80 [mask-image:linear-gradient(270deg,transparent,black_62%)]" />
        <FlowField paths={rightField} className="absolute top-[-16%] -right-[6%] h-[132%] w-[84%] max-w-none [mask-image:linear-gradient(105deg,transparent,black_18%,black_72%,transparent)]" />
        <FlowField paths={knotField} className="absolute top-[-8%] right-[-2%] h-[78%] w-[58%] max-w-none [mask-image:radial-gradient(circle_at_68%_38%,black,transparent_72%)]" />
      </div>
      </motion.div>
      <div className="relative mx-auto flex w-full max-w-7xl flex-col px-6 pt-16 pb-24 md:px-10 md:pb-28">
        <RevealOnScroll variant="fadeScale" motion={{ ...motionPresets.fade, delay: 200, onScroll: false }}>
          <p className="text-xs font-medium tracking-[0.32em] text-[#2078CF] uppercase">{legalName}</p>
        </RevealOnScroll>
        <h1 className="relative mt-6 max-w-full text-white">
          <MotionReveal
            as="span"
            variant="pageLoadPopup"
            soft
            duration={1.2}
            onScroll={false}
            delay={0.08}
            className="pointer-events-none absolute -inset-x-8 -top-8 bottom-0 origin-left bg-[radial-gradient(ellipse_at_left,rgba(32,120,207,0.4),transparent_68%)]"
          />
          <span className="typewriter-finish relative">
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
          <RevealOnScroll motion={{ ...motionPresets.fade, delay: 1700, onScroll: false }}>
            <div className="grid max-w-md gap-5">
              <p className="text-lg font-medium text-[#b7c4de]">
                Direction créative d&apos;{director}. {promise}
              </p>
              {publishedCount > 0 ? <AnimatedCounter value={publishedCount} label="créations publiées" /> : null}
            </div>
          </RevealOnScroll>
          <RevealOnScroll variant="pageLoadPopup" motion={{ ...motionPresets.fade, delay: 3600, onScroll: false }}>
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
        <MotionReveal variant="fadeScale" onScroll={false} delay={4.15}>
        <SectionLink
          id="images"
          className="grid size-12 place-items-center rounded-full border border-[#2078CF]/50 text-white shadow-[0_0_18px_rgba(32,120,207,0.35)] transition duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2078CF] motion-safe:hover:-translate-y-1 motion-safe:hover:border-[#2078CF] motion-safe:hover:shadow-[0_0_24px_rgba(32,120,207,0.45)]"
        >
          <ChevronDown className="scroll-cue size-6" aria-hidden />
          <span className="sr-only">Descendre vers Images / Affiches</span>
        </SectionLink>
        </MotionReveal>
      </div>
    </section>
  );
}

const rightField = buildField("right", 52);
const knotField = buildField("knot", 22);
const leftField = buildField("left", 16);

function FlowField({ paths, className }: { paths: LinePath[]; className: string }) {
  return (
    <svg viewBox="0 0 1000 1000" fill="none" aria-hidden className={className}>
      {paths.map((line, index) => (
        <path
          key={index}
          d={line.d}
          stroke={line.core > 0.55 ? "#2078CF" : "#0E4EB2"}
          strokeOpacity={line.opacity}
          strokeWidth={line.core > 0.72 ? 1.05 : 0.7}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

type LinePath = { d: string; opacity: number; core: number };

function buildField(kind: "right" | "knot" | "left", count: number): LinePath[] {
  return Array.from({ length: count }, (_, index) => {
    const n = index / Math.max(count - 1, 1);
    const spread = n - 0.5;
    const core = Math.max(0, 1 - Math.abs(spread) * 2.15);
    const points = sample(kind, spread, n);
    return {
      d: smoothPath(points),
      core,
      opacity: kind === "left" ? 0.045 + core * 0.1 : kind === "knot" ? 0.12 + core * 0.5 : 0.05 + core * 0.42,
    };
  });
}

function sample(kind: "right" | "knot" | "left", spread: number, n: number) {
  const steps = kind === "knot" ? 12 : 20;
  const start = kind === "knot" ? 0.08 : 0;
  const end = kind === "knot" ? 0.62 : 1;
  const points: [number, number][] = [];
  for (let step = 0; step <= steps; step += 1) {
    const t = start + (end - start) * (step / steps);
    points.push(pointAt(kind, t, spread, n));
  }
  return points;
}

function pointAt(kind: "right" | "knot" | "left", t: number, spread: number, n: number): [number, number] {
  if (kind === "left") {
    const wave = Math.sin(t * Math.PI + spread * 2);
    return [round(-40 + t * 560 + wave * 36), round(60 + spread * 460 + t * 820 + wave * 28)];
  }
  const pinch = Math.exp(-((t - 0.34) ** 2) / 0.011);
  const wave = Math.sin(t * Math.PI * 1.45 + spread * 1.6);
  const fold = Math.sin(t * Math.PI * 2.6) * (kind === "knot" ? 70 : 120);
  const x = 1160 - t * (kind === "knot" ? 760 : 980) + fold - pinch * spread * (kind === "knot" ? 150 : 260);
  const y = -20 + t * 1120 + spread * (kind === "knot" ? 150 : 300 + t * 160) + wave * (18 + pinch * 46) + n * 8;
  return [round(x), round(y)];
}

function smoothPath(points: [number, number][]) {
  let path = `M ${points[0][0]} ${points[0][1]}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index === 0 ? index : index - 1];
    const current = points[index];
    const next = points[index + 1];
    const after = points[index + 2] ?? next;
    const c1x = round(current[0] + (next[0] - previous[0]) / 6);
    const c1y = round(current[1] + (next[1] - previous[1]) / 6);
    const c2x = round(next[0] - (after[0] - current[0]) / 6);
    const c2y = round(next[1] - (after[1] - current[1]) / 6);
    path += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${next[0]} ${next[1]}`;
  }
  return path;
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}
