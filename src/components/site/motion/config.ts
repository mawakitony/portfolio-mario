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

export type AnimationVariant = "pageLoad" | "popUp" | "zoomOut" | "fadeScale" | "staggerDropDown" | "staggerScale";

export const animationVariants: Record<
  AnimationVariant,
  { hidden: { opacity: number; y?: number; scale?: number }; show: { opacity: number; y: number; scale: number }; duration: number; bounce?: boolean }
> = {
  pageLoad: {
    hidden: { opacity: 0, y: -16 },
    show: { opacity: 1, y: 0, scale: 1 },
    duration: 0.7,
  },
  popUp: {
    hidden: { opacity: 0, scale: 0.85 },
    show: { opacity: 1, y: 0, scale: 1 },
    duration: 0.62,
    bounce: true,
  },
  zoomOut: {
    hidden: { opacity: 0.7, scale: 1.12 },
    show: { opacity: 1, y: 0, scale: 1 },
    duration: 1,
  },
  fadeScale: {
    hidden: { opacity: 0, y: 16, scale: 0.96 },
    show: { opacity: 1, y: 0, scale: 1 },
    duration: 0.65,
  },
  staggerDropDown: {
    hidden: { opacity: 0, y: -20 },
    show: { opacity: 1, y: 0, scale: 1 },
    duration: 0.55,
  },
  staggerScale: {
    hidden: { opacity: 0, scale: 0.9 },
    show: { opacity: 1, y: 0, scale: 1 },
    duration: 0.6,
  },
};

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
