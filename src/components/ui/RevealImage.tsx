"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap, registerGsap } from "@/lib/gsap";
import { useReducedMotion } from "@/components/providers/ReducedMotionProvider";
import { usePreloader } from "@/components/providers/PreloaderProvider";

type Variant = "scale" | "mask" | "clip" | "parallax";

type RevealImageProps = {
  children: ReactNode;
  className?: string;
  variant?: Variant;
  delay?: number;
};

export function RevealImage({
  children,
  className = "",
  variant = "scale",
  delay = 0,
}: RevealImageProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const { reducedMotion } = useReducedMotion();
  const { complete } = usePreloader();

  useEffect(() => {
    if (!complete || !wrapRef.current || !innerRef.current) return;
    registerGsap();

    if (reducedMotion) {
      gsap.set([wrapRef.current, innerRef.current], {
        clearProps: "all",
        opacity: 1,
      });
      return;
    }

    const wrap = wrapRef.current;
    const inner = innerRef.current;
    const ctx = gsap.context(() => {
      if (variant === "mask") {
        gsap.fromTo(
          wrap,
          { clipPath: "inset(0 50% 0 50%)", opacity: 0.4 },
          {
            clipPath: "inset(0 0% 0 0%)",
            opacity: 1,
            duration: 1.35,
            delay,
            ease: "power3.inOut",
            scrollTrigger: { trigger: wrap, start: "top 80%", once: true },
          },
        );
        gsap.fromTo(
          inner,
          { scale: 1.2 },
          {
            scale: 1,
            duration: 1.5,
            delay,
            ease: "power2.out",
            scrollTrigger: { trigger: wrap, start: "top 80%", once: true },
          },
        );
      } else if (variant === "clip") {
        gsap.fromTo(
          wrap,
          { clipPath: "inset(100% 0 0 0)", opacity: 0 },
          {
            clipPath: "inset(0% 0 0 0)",
            opacity: 1,
            duration: 1.2,
            delay,
            ease: "power3.out",
            scrollTrigger: { trigger: wrap, start: "top 82%", once: true },
          },
        );
      } else if (variant === "parallax") {
        gsap.fromTo(
          wrap,
          { opacity: 0, y: 60 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            delay,
            ease: "power2.out",
            scrollTrigger: { trigger: wrap, start: "top 85%", once: true },
          },
        );
        gsap.fromTo(
          inner,
          { yPercent: -8 },
          {
            yPercent: 8,
            ease: "none",
            scrollTrigger: {
              trigger: wrap,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      } else {
        gsap.fromTo(
          wrap,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.9,
            delay,
            ease: "power2.out",
            scrollTrigger: { trigger: wrap, start: "top 85%", once: true },
          },
        );
        gsap.fromTo(
          inner,
          { scale: 1.15 },
          {
            scale: 1,
            duration: 1.35,
            delay,
            ease: "power3.out",
            scrollTrigger: { trigger: wrap, start: "top 85%", once: true },
          },
        );
      }
    }, wrap);

    return () => ctx.revert();
  }, [complete, reducedMotion, variant, delay]);

  return (
    <div ref={wrapRef} className={`overflow-hidden ${className}`}>
      <div ref={innerRef} className="h-full w-full will-change-transform">
        {children}
      </div>
    </div>
  );
}
