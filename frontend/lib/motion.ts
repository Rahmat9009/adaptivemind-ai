export const motionDurations = { quick: 0.16, standard: 0.28, reveal: 0.5 } as const;
export const springTransition = { type: "spring", stiffness: 320, damping: 28 } as const;

/* Editorial easing — used by motion primitives across the app */
export const easeOutExpo = [0.16, 1, 0.3, 1] as const;
export const easeInOutQuint = [0.83, 0, 0.17, 1] as const;

/* Reveal-up — the signature entrance. Words/blocks rise and settle. */
export const revealUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.6, ease: easeOutExpo },
} as const;

/* Staggered children — for sequences of cards/lines. */
export const staggerContainer = (stagger = 0.08, delay = 0) => ({
  initial: {},
  animate: { transition: { staggerChildren: stagger, delayChildren: delay } },
} as const);

export const staggerChild = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.55, ease: easeOutExpo } },
} as const;

/* Subtle hover-lift for interactive cards */
export const hoverLift = {
  rest: { y: 0 },
  hover: { y: -4, transition: { duration: 0.28, ease: easeOutExpo } },
} as const;
