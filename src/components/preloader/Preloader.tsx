"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, registerGsap } from "@/lib/gsap";
import { athlete } from "@/lib/content";
import { assets } from "@/lib/assets";
import { usePreloader } from "@/components/providers/PreloaderProvider";
import { useReducedMotion } from "@/components/providers/ReducedMotionProvider";

const KEY = "aziz-preloader-seen";

export function Preloader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const { setComplete } = usePreloader();
  const { reducedMotion } = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    registerGsap();
    const root = rootRef.current;
    if (!root) return;

    let killed = false;
    const shorten =
      typeof sessionStorage !== "undefined" &&
      sessionStorage.getItem(KEY) === "1";

    const targets = shorten ? [100] : [0, 34, 67, 100];
    const cap = shorten ? 800 : 2200;

    const img = new Image();
    img.src = assets.hero;

    const progressObj = { value: 0 };
    const tl = gsap.timeline({
      onComplete: () => {
        if (killed) return;
        try {
          sessionStorage.setItem(KEY, "1");
        } catch {
          /* ignore */
        }

        if (reducedMotion) {
          gsap.to(root, {
            opacity: 0,
            duration: 0.35,
            onComplete: () => {
              setDone(true);
              setComplete(true);
            },
          });
          return;
        }

        const exit = gsap.timeline({
          onComplete: () => {
            setDone(true);
            setComplete(true);
          },
        });

        exit
          .to(".preloader-copy", { opacity: 0, duration: 0.25 }, 0)
          .fromTo(
            lineRef.current,
            { scaleX: 0, opacity: 1 },
            { scaleX: 1, duration: 0.45, ease: "power2.inOut" },
            0.1,
          )
          .to(lineRef.current, {
            scaleY: window.innerHeight,
            duration: 0.7,
            ease: "power3.inOut",
          })
          .to(root, { opacity: 0, duration: 0.35 }, "-=0.15");
      },
    });

    const stepDuration = shorten ? 0.35 : Math.min(cap / 1000 / targets.length, 0.55);

    targets.forEach((t, i) => {
      tl.to(progressObj, {
        value: t,
        duration: stepDuration,
        ease: "power2.out",
        onUpdate: () => {
          if (!killed) setProgress(Math.round(progressObj.value));
        },
      }, i === 0 ? 0 : ">");
    });

    // Ensure we don't hang if image is slow — timeline already caps visually
    const safety = window.setTimeout(() => {
      if (!killed && progressObj.value < 100) {
        gsap.to(progressObj, {
          value: 100,
          duration: 0.3,
          onUpdate: () => setProgress(Math.round(progressObj.value)),
        });
      }
    }, cap);

    return () => {
      killed = true;
      window.clearTimeout(safety);
      tl.kill();
    };
  }, [reducedMotion, setComplete]);

  if (done) return null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-ocean-deep"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="preloader-copy text-center">
        <p className="font-display text-4xl tracking-[0.28em] text-foam md:text-6xl">
          {athlete.name}
        </p>
        <p className="mt-4 text-[11px] tracking-[0.35em] text-foam-muted">
          {athlete.tagline}
        </p>
        <p className="mt-10 font-display text-5xl tabular-nums text-foam/90 md:text-7xl">
          {progress}%
        </p>
      </div>
      <div
        ref={lineRef}
        className="pointer-events-none absolute left-1/2 top-1/2 h-px w-full origin-center scale-x-0 bg-foam"
        style={{ transform: "translate(-50%, -50%) scaleX(0)" }}
      />
    </div>
  );
}
