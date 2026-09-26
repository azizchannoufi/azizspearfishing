"use client";

import { useEffect, useState } from "react";
import { useLenis } from "@/components/providers/LenisProvider";
import { useReducedMotion } from "@/components/providers/ReducedMotionProvider";

export function ScrollProgress() {
  const { lenis } = useLenis();
  const { reducedMotion } = useReducedMotion();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (reducedMotion) {
      const onScroll = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? window.scrollY / max : 0);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      return () => window.removeEventListener("scroll", onScroll);
    }

    if (!lenis) return;
    const unsub = lenis.on("scroll", ({ progress: p }) => {
      setProgress(p);
    });
    return () => {
      unsub?.();
    };
  }, [lenis, reducedMotion]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed top-0 right-4 z-[60] hidden h-screen py-10 md:flex"
    >
      <div className="relative h-full w-px bg-white/10">
        <div
          className="absolute top-0 left-0 w-px origin-top bg-accent-teal"
          style={{
            transform: `scaleY(${Math.min(1, Math.max(0, progress))})`,
            height: "100%",
          }}
        />
      </div>
    </div>
  );
}
