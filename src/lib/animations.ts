// Unified animation timing system for the entire app
// Based on Lingque Jade Teal design system

// Easing curves
export const EASE_DEFAULT = [0.4, 0, 0.2, 1] as const;
export const EASE_SPRING = [0.175, 0.885, 0.32, 1.275] as const;

// Duration scale (ms-based naming, used as seconds in framer-motion)
export const DURATION = {
  fast: 0.2,      // micro-interactions: hover, focus
  normal: 0.35,   // standard transitions: phase changes
  slow: 0.6,      // entrance animations: reveal, expand
  slower: 0.8,    // hero animations: page load
} as const;

// Shared Framer Motion variants
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: DURATION.slow, ease: EASE_DEFAULT },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: DURATION.normal, ease: EASE_DEFAULT },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: DURATION.normal, ease: EASE_DEFAULT },
};

// Phase transition variant (used by page.tsx for upload/running/completed phases)
export const phaseVariants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const phaseTransition = {
  duration: DURATION.normal,
  ease: EASE_DEFAULT,
};

// Staggered children container
export const staggerContainer = (staggerDelay = 0.05) => ({
  animate: { transition: { staggerChildren: staggerDelay } },
});

// List item variant for staggered entry
export const listItem = {
  initial: { opacity: 0, x: -16 },
  animate: { opacity: 1, x: 0, transition: { duration: DURATION.normal, ease: EASE_DEFAULT } },
};
