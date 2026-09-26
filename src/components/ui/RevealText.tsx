"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap, registerGsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/components/providers/ReducedMotionProvider";
import { usePreloader } from "@/components/providers/PreloaderProvider";

type Variant = "rise" | "blur" | "clip" | "lines";

type RevealTextProps = {
  children: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  variant?: Variant;
  delay?: number;
};

export function RevealText({
  children,
  className = "",
  as: Tag = "div",
  variant = "rise",
  delay = 0,
}: RevealTextProps) {
  const ref = useRef<HTMLElement>(null);
  const { reducedMotion } = useReducedMotion();
  const { complete } = usePreloader();

  useEffect(() => {
    if (!complete || !ref.current) return;
    registerGsap();
    const el = ref.current;

    if (reducedMotion) {
      gsap.set(el, { clearProps: "all", opacity: 1 });
      return;
    }

    const fromVars: gsap.TweenVars =
      variant === "blur"
        ? { opacity: 0, filter: "blur(12px)", y: 28 }
        : variant === "clip"
          ? { opacity: 0, clipPath: "inset(100% 0 0 0)", y: 40 }
          : { opacity: 0, y: 80 };

    const ctx = gsap.context(() => {
      gsap.fromTo(el, fromVars, {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        clipPath: "inset(0% 0 0 0)",
        duration: 1.15,
        delay,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          once: true,
        },
      });
    }, el);

    return () => {
      ctx.revert();
      ScrollTrigger.getAll()
        .filter((t) => t.trigger === el)
        .forEach((t) => t.kill());
    };
  }, [complete, reducedMotion, variant, delay]);

  return (
    <Tag ref={ref as never} className={className}>
      {children}
    </Tag>
  );
}
