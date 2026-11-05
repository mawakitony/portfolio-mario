export type MotionType = "horizontal" | "vertical" | "fade" | "rotate" | "scale";

export type MotionDevice = "all" | "desktop" | "tablet" | "mobile";

export type MotionConfig = {
  type: MotionType;
  enabled: boolean;
  devices: MotionDevice;
  duration: number;
  delay: number;
  distance: number;
  intensity: number;
  onScroll: boolean;
  repeat: boolean;
  /** Outline the element in development when true. */
  preview: boolean;
};

export const motionPresets = {
  rise: {
    type: "vertical",
    enabled: true,
    devices: "all",
    duration: 700,
    delay: 0,
    distance: 22,
    intensity: 1,
    onScroll: true,
    repeat: false,
    preview: false,
  },
  fade: {
    type: "fade",
    enabled: true,
    devices: "all",
    duration: 700,
    delay: 0,
    distance: 0,
    intensity: 1,
    onScroll: true,
    repeat: false,
    preview: false,
  },
  fromLeft: {
    type: "horizontal",
    enabled: true,
    devices: "all",
    duration: 700,
    delay: 0,
    distance: -28,
    intensity: 1,
    onScroll: true,
    repeat: false,
    preview: false,
  },
  fromRight: {
    type: "horizontal",
    enabled: true,
    devices: "all",
    duration: 700,
    delay: 0,
    distance: 28,
    intensity: 1,
    onScroll: true,
    repeat: false,
    preview: false,
  },
  scaleIn: {
    type: "scale",
    enabled: true,
    devices: "all",
    duration: 700,
    delay: 0,
    distance: 0,
    intensity: 0.96,
    onScroll: true,
    repeat: false,
    preview: false,
  },
  tilt: {
    type: "rotate",
    enabled: true,
    devices: "all",
    duration: 700,
    delay: 0,
    distance: -8,
    intensity: 1,
    onScroll: true,
    repeat: false,
    preview: false,
  },
} satisfies Record<string, MotionConfig>;

export const motionEase = [0.22, 1, 0.36, 1] as const;

export type AnimationVariant =
  | "pageLoadScroll"
  | "pageLoadPopup"
  | "zoomOut"
  | "fadeScale"
  | "staggerDropDown"
  | "staggerScale"
  | "pageLoad"
  | "popUp";

type AnimationPreset = {
  hidden: { opacity: number; y?: number; scale?: number };
  show: { opacity: number; y: number; scale: number };
  duration: number;
  bounce?: boolean;
};

const animationPresets = {
  pageLoadScroll: {
    hidden: { opacity: 0, y: -16 },
    show: { opacity: 1, y: 0, scale: 1 },
    duration: 0.75,
  },
  pageLoadPopup: {
    hidden: { opacity: 0, scale: 0.86 },
    show: { opacity: 1, y: 0, scale: 1 },
    duration: 0.62,
    bounce: true,
  },
  zoomOut: {
    hidden: { opacity: 0.7, scale: 1.12 },
    show: { opacity: 1, y: 0, scale: 1 },
    duration: 0.9,
  },
  fadeScale: {
    hidden: { opacity: 0, y: 16, scale: 0.96 },
    show: { opacity: 1, y: 0, scale: 1 },
    duration: 0.68,
  },
  staggerDropDown: {
    hidden: { opacity: 0, y: -20 },
    show: { opacity: 1, y: 0, scale: 1 },
    duration: 0.58,
  },
  staggerScale: {
    hidden: { opacity: 0, y: 14, scale: 0.9 },
    show: { opacity: 1, y: 0, scale: 1 },
    duration: 0.62,
  },
} satisfies Record<string, AnimationPreset>;

export function animationPreset(variant: AnimationVariant): AnimationPreset {
  if (variant === "pageLoad") return animationPresets.pageLoadScroll;
  if (variant === "popUp") return animationPresets.pageLoadPopup;
  return animationPresets[variant];
}

export function resolveMotion(config: MotionConfig) {
  const fade = config.intensity >= 1 ? 0 : 1 - config.intensity;
  switch (config.type) {
    case "horizontal":
      return { x: config.distance, y: 0, scale: 1, rotate: 0, opacity: fade };
    case "vertical":
      return { x: 0, y: config.distance, scale: 1, rotate: 0, opacity: fade };
    case "fade":
      return { x: 0, y: 0, scale: 1, rotate: 0, opacity: fade };
    case "rotate":
      return { x: 0, y: 0, scale: 1, rotate: config.distance, opacity: 1 };
    case "scale":
      return { x: config.distance, y: 0, scale: config.intensity, rotate: 0, opacity: 0 };
  }
}
