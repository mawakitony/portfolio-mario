import type { ReactNode } from "react";
import type { MotionConfig } from "@/components/site/motion/config";
import { RevealOnScroll } from "@/components/site/motion/reveal-on-scroll";
import { cn } from "@/lib/utils";

export function AnimatedSection({
  children,
  className,
  motion,
}: {
  children: ReactNode;
  className?: string;
  motion?: MotionConfig;
}) {
  return (
    <RevealOnScroll className={cn(className)} motion={motion}>
      {children}
    </RevealOnScroll>
  );
}
