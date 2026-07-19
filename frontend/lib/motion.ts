export const motionDurations = {
  fast: 0.12,
  quick: 0.18,
  standard: 0.28,
  reveal: 0.45,
  slow: 0.65,
} as const;

export const amEasing = {
  out: [0.16, 1, 0.3, 1] as [number, number, number, number],
  inOut: [0.65, 0, 0.35, 1] as [number, number, number, number],
  spring: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
};

export const springTransition = {
  type: "spring" as const,
  stiffness: 320,
  damping: 28,
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: motionDurations.standard, ease: amEasing.out },
};

export const slideUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: motionDurations.standard, ease: amEasing.out },
};

export const slideInLeft = {
  initial: { opacity: 0, x: -16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -16 },
  transition: { duration: motionDurations.standard, ease: amEasing.out },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: motionDurations.quick, ease: amEasing.out },
};

export const staggerContainer = {
  initial: {},
  animate: { transition: { staggerChildren: 0.04, delayChildren: 0.08 } },
  exit: {},
};

export const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: motionDurations.standard, ease: amEasing.out },
};

export const cardHover = {
  rest: { y: 0, boxShadow: "0 1px 3px rgba(8,12,27,0.06)" },
  hover: { y: -2, boxShadow: "0 8px 32px rgba(8,12,27,0.10)" },
};
