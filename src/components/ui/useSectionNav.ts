"use client";

import { useLenis } from "@/components/providers/LenisProvider";
import { useReducedMotion } from "@/components/providers/ReducedMotionProvider";

export function useSectionNav() {
  const { lenis } = useLenis();
  const { reducedMotion } = useReducedMotion();

  const navigateTo = async (href: string) => {
    const id = href.replace("#", "");
    const el = document.getElementById(id);
    if (!el) return;

    const wipe = document.getElementById("section-wipe");
    if (wipe && !reducedMotion) {
      wipe.dataset.active = "true";
      await new Promise((r) => setTimeout(r, 280));
    }

    if (lenis && !reducedMotion) {
      lenis.scrollTo(el, { offset: 0, duration: 1.2 });
    } else {
      el.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
    }

    if (wipe && !reducedMotion) {
      await new Promise((r) => setTimeout(r, 220));
      wipe.dataset.active = "false";
    }

    window.history.replaceState(null, "", href);
  };

  return { navigateTo };
}
