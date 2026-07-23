export const motionDurations = {
  fast: 0.12,
  quick: 0.2,
  standard: 0.3,
  reveal: 0.55,
  slow: 0.7,
} as const;

export const amEasing = {
  out: [0.16, 1, 0.3, 1] as [number, number, number, number],
  inOut: [0.65, 0, 0.35, 1] as [number, number, number, number],
  spring: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: motionDurations.standard, ease: amEasing.out },
};

export const slideUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: motionDurations.standard, ease: amEasing.out },
};

export const slideUpReveal = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: motionDurations.reveal, ease: amEasing.out },
};

export const slideInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: motionDurations.standard, ease: amEasing.out },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.96 },
  transition: { duration: motionDurations.quick, ease: amEasing.out },
};

export const staggerContainer = {
  initial: {},
  animate: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
  exit: {},
};

export const staggerItem = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: motionDurations.standard, ease: amEasing.out },
};

export const textReveal = {
  initial: { y: 32 },
  animate: { y: 0 },
  transition: { duration: motionDurations.reveal, ease: amEasing.out, staggerChildren: 0.03 },
};
