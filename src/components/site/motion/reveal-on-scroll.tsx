"use client";

import type { ReactNode } from "react";
import { motionPresets, type AnimationVariant, type MotionConfig } from "@/components/site/motion/config";
import { MotionReveal } from "@/components/site/motion/motion-reveal";

export function RevealOnScroll({
  children,
  className,
  delay = 0,
  as = "div",
  motion,
  variant,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "span" | "li" | "header";
  motion?: MotionConfig;
  variant?: AnimationVariant;
}) {
  const config = motion ?? { ...motionPresets.fade, delay };
  if (!config.enabled) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionReveal
      as={as}
      className={className}
      variant={variant ?? variantFrom(config)}
      delay={(config.delay || delay) / 1000}
      onScroll={config.onScroll}
    >
      {children}
    </MotionReveal>
  );
}

function variantFrom(config: MotionConfig): AnimationVariant {
  if (config.type === "scale") return "staggerScale";
  if (config.type === "vertical" && config.distance < 0) return "staggerDropDown";
  return "fadeScale";
}
