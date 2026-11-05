"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ParallaxMedia({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(min-width: 768px)").matches;
    if (reduce || !fine) return;

    let frame = 0;
    function update() {
      frame = 0;
      const current = ref.current;
      if (!current) return;
      const rect = current.getBoundingClientRect();
      const delta = (rect.top + rect.height / 2 - window.innerHeight / 2) * -0.04;
      const shift = Math.max(-18, Math.min(18, delta));
      current.style.transform = `translate3d(0, ${shift}px, 0)`;
    }
    function onScroll() {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
      node.style.transform = "";
    };
  }, []);

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}
