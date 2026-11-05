"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { animationPreset, motionEase, type AnimationVariant } from "@/components/site/motion/config";
import { cn } from "@/lib/utils";

const tags = {
  div: motion.div,
  span: motion.span,
  li: motion.li,
  header: motion.header,
};

export function MotionReveal({
  children,
  className,
  variant = "fadeScale",
  delay = 0,
  duration,
  onScroll = true,
  soft = false,
  as = "div",
}: {
  children?: ReactNode;
  className?: string;
  variant?: AnimationVariant;
  delay?: number;
  duration?: number;
  onScroll?: boolean;
  soft?: boolean;
  as?: keyof typeof tags;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -8% 0px", amount: 0.2 });
  const reduce = useReducedMotion();
  const [live, setLive] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setLive(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  if (reduce) {
    const Plain = as;
    return (
      <Plain ref={ref as never} className={className}>
        {children}
      </Plain>
    );
  }

  if (!live) {
    const Plain = as;
    return (
      <Plain ref={ref as never} className={cn("anim-pending", className)} data-anim={variant}>
        {children}
      </Plain>
    );
  }

  const preset = animationPreset(variant);
  const mobile = window.matchMedia("(max-width: 767px)").matches;
  const hidden = soften(preset.hidden, mobile);
  const Tag = tags[as];
  const visible = !onScroll || inView;
  const time = duration ?? preset.duration;

  return (
    <Tag
      ref={ref as never}
      className={className}
      initial={hidden}
      animate={visible ? preset.show : hidden}
      transition={
        preset.bounce && !soft
          ? { type: "spring", duration: time, bounce: 0.16, delay }
          : { duration: time, delay, ease: motionEase }
      }
    >
      {children}
    </Tag>
  );
}

function soften(hidden: { opacity: number; y?: number; scale?: number }, mobile: boolean) {
  if (!mobile) return hidden;
  return {
    ...hidden,
    y: hidden.y === undefined ? undefined : hidden.y * 0.55,
    scale: hidden.scale === undefined ? undefined : 1 + (hidden.scale - 1) * 0.5,
  };
}
