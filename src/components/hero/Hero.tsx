"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { athlete } from "@/lib/content";
import { assets } from "@/lib/assets";
import { gsap, registerGsap } from "@/lib/gsap";
import { usePreloader } from "@/components/providers/PreloaderProvider";
import { useReducedMotion } from "@/components/providers/ReducedMotionProvider";
import { isTouchDevice } from "@/lib/motion";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { UnderwaterAtmosphere } from "@/components/effects/UnderwaterAtmosphere";
import { useSectionNav } from "@/components/ui/useSectionNav";

export function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const athleteRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const brandRef = useRef<HTMLHeadingElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const { complete } = usePreloader();
  const { reducedMotion } = useReducedMotion();
  const { navigateTo } = useSectionNav();

  useEffect(() => {
    if (!complete || !rootRef.current) return;
    registerGsap();

    const ctx = gsap.context(() => {
      if (reducedMotion) {
        gsap.set(
          [bgRef.current, brandRef.current, ctaRef.current, ...wordsRef.current],
          { opacity: 1, y: 0, filter: "none", letterSpacing: "0.06em" },
        );
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        bgRef.current,
        { opacity: 0, scale: 1.08 },
        { opacity: 1, scale: 1, duration: 1.8 },
      )
        .fromTo(
          brandRef.current,
          {
            opacity: 0,
            y: 40,
            filter: "blur(10px)",
            letterSpacing: "0.4em",
            clipPath: "inset(100% 0 0 0)",
          },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            letterSpacing: "0.18em",
            clipPath: "inset(0% 0 0 0)",
            duration: 1.1,
          },
          "-=1.1",
        );

      wordsRef.current.forEach((word, i) => {
        if (!word) return;
        tl.fromTo(
          word,
          {
            opacity: 0,
            y: 56,
            filter: "blur(12px)",
            letterSpacing: "0.35em",
            clipPath: "inset(100% 0 0 0)",
          },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            letterSpacing: "0.22em",
            clipPath: "inset(0% 0 0 0)",
            duration: 0.9,
          },
          i === 0 ? "-=0.35" : "-=0.55",
        );
      });

      tl.fromTo(
        ctaRef.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.7 },
        "-=0.25",
      );
    }, rootRef);

    return () => ctx.revert();
  }, [complete, reducedMotion]);

  useEffect(() => {
    if (!complete || reducedMotion || isTouchDevice()) return;
    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      gsap.to(bgRef.current, {
        x: nx * -14,
        y: ny * -10,
        duration: 1.1,
        ease: "power2.out",
        overwrite: "auto",
      });
      gsap.to(athleteRef.current, {
        x: nx * 10,
        y: ny * 8,
        duration: 1.2,
        ease: "power2.out",
        overwrite: "auto",
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [complete, reducedMotion]);

  return (
    <section
      id="hero"
      ref={rootRef}
      className="relative flex min-h-[100svh] items-end overflow-hidden bg-ocean-deep pb-16 pt-28 md:items-center md:pb-0"
    >
      <div
        ref={bgRef}
        className="absolute inset-[-4%] will-change-transform"
        style={{ opacity: 0 }}
      >
        <Image
          src={assets.hero}
          alt="Underwater spearfishing atmosphere"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ocean-deep/55 via-ocean-deep/35 to-ocean-deep" />
        <div className="absolute inset-0 bg-gradient-to-r from-ocean-deep/70 via-transparent to-ocean-deep/40" />
      </div>

      <div
        ref={athleteRef}
        className="pointer-events-none absolute inset-y-[12%] right-[-8%] hidden w-[42%] will-change-transform md:block"
      >
        <div className="relative h-full w-full">
          <Image
            src={assets.brandPortrait}
            alt=""
            fill
            sizes="40vw"
            className="object-contain object-bottom opacity-80"
          />
        </div>
      </div>

      <UnderwaterAtmosphere />

      <div className="section-pad relative z-10 w-full max-w-6xl">
        <h1
          ref={brandRef}
          className="font-display text-[clamp(4.5rem,14vw,9rem)] leading-[0.9] text-foam"
          style={{ opacity: 0 }}
        >
          {athlete.name}
        </h1>

        <div className="mt-6 flex flex-col gap-1 md:mt-8">
          {athlete.roles.map((role, i) => (
            <span
              key={role}
              ref={(el) => {
                wordsRef.current[i] = el;
              }}
              className="font-display text-[clamp(1.4rem,4vw,2.6rem)] text-foam/90"
              style={{ opacity: 0 }}
            >
              {role}
            </span>
          ))}
        </div>

        <div ref={ctaRef} className="mt-10" style={{ opacity: 0 }}>
          <MagneticButton
            href="#about"
            onClick={(e) => {
              e.preventDefault();
              navigateTo("#about");
            }}
          >
            {athlete.cta} →
          </MagneticButton>
        </div>
      </div>
    </section>
  );
}
