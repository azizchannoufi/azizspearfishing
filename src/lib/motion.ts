export const easings = {
  cinematic: [0.22, 1, 0.36, 1] as const,
  soft: [0.33, 1, 0.68, 1] as const,
  magnetic: { type: "spring" as const, stiffness: 280, damping: 22, mass: 0.6 },
};

export const durations = {
  pageWipe: 0.55,
  reveal: 1.05,
  heroWord: 0.85,
  modal: 0.45,
};

export function isTouchDevice() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
}

export function isDesktopCapable() {
  if (typeof window === "undefined") return false;
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  return !isTouchDevice() && cores >= 4 && memory >= 4;
}
