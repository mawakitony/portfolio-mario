"use client";

import { RevealOnScroll } from "@/components/site/motion/reveal-on-scroll";

export function StaggeredText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const words = text.split(/\s+/).filter(Boolean);

  return (
    <span className={className}>
      {words.map((word, index) => (
        <RevealOnScroll key={`${word}-${index}`} as="span" className="inline-block" delay={index * 70}>
          {word}
          {index < words.length - 1 ? "\u00a0" : null}
        </RevealOnScroll>
      ))}
    </span>
  );
}
