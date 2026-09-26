"use client";

import { useEffect, useRef } from "react";
import { stats } from "@/lib/content";
import { gsap, registerGsap } from "@/lib/gsap";
import { usePreloader } from "@/components/providers/PreloaderProvider";
import { useReducedMotion } from "@/components/providers/ReducedMotionProvider";
import { RevealText } from "@/components/ui/RevealText";

export function StatsSection() {
  const rootRef = useRef<HTMLElement>(null);
  const valuesRef = useRef<(HTMLSpanElement | null)[]>([]);
  const { complete } = usePreloader();
  const { reducedMotion } = useReducedMotion();

  useEffect(() => {
    if (!complete || !rootRef.current) return;
    registerGsap();

    if (reducedMotion) {
      stats.forEach((s, i) => {
        const el = valuesRef.current[i];
        if (el) el.textContent = `${s.value}${s.suffix}`;
      });
      return;
    }

    const ctx = gsap.context(() => {
      valuesRef.current.forEach((el, i) => {
        if (!el) return;
        const s = stats[i];
        const obj = { val: 0 };
        gsap.to(obj, {
          val: s.value,
          duration: 1.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top 70%",
            once: true,
          },
          onUpdate: () => {
            el.textContent = `${Math.round(obj.val)}${s.suffix}`;
          },
        });
      });
    }, rootRef);

    return () => ctx.revert();
  }, [complete, reducedMotion]);

  return (
    <section
      ref={rootRef}
      className="relative bg-gradient-to-b from-ocean-mid/40 via-ocean-deep to-ocean-deep py-24 md:py-32"
    >
      <div className="section-pad mx-auto max-w-6xl">
        <RevealText
          as="p"
          variant="blur"
          className="text-center text-[11px] tracking-[0.35em] text-foam-muted"
        >
          BY THE NUMBERS
        </RevealText>
        <div className="mt-14 grid gap-12 md:grid-cols-3">
          {stats.map((s, i) => (
            <div key={s.label} className="text-center">
              <span
                ref={(el) => {
                  valuesRef.current[i] = el;
                }}
                className="font-display text-[clamp(3.5rem,8vw,6rem)] leading-none text-foam"
              >
                0
              </span>
              <p className="mt-3 text-[11px] tracking-[0.28em] text-foam-muted">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
