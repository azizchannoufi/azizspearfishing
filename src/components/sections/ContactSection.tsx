"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { athlete } from "@/lib/content";
import { assets } from "@/lib/assets";
import { gsap, registerGsap } from "@/lib/gsap";
import { usePreloader } from "@/components/providers/PreloaderProvider";
import { useReducedMotion } from "@/components/providers/ReducedMotionProvider";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { RevealText } from "@/components/ui/RevealText";

export function ContactSection() {
  const rootRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const socialsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const { complete } = usePreloader();
  const { reducedMotion } = useReducedMotion();

  useEffect(() => {
    if (!complete || !rootRef.current || !bgRef.current) return;
    registerGsap();

    if (reducedMotion) {
      gsap.set(bgRef.current, { opacity: 0.55 });
      socialsRef.current.forEach((el) => el && gsap.set(el, { opacity: 1 }));
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        bgRef.current,
        { opacity: 0 },
        {
          opacity: 0.55,
          ease: "none",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top 70%",
            end: "top 10%",
            scrub: true,
          },
        },
      );

      socialsRef.current.forEach((el, i) => {
        if (!el) return;
        gsap.fromTo(
          el,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            delay: i * 0.12,
            ease: "power3.out",
            scrollTrigger: {
              trigger: rootRef.current,
              start: "top 45%",
              once: true,
            },
          },
        );
      });
    }, rootRef);

    return () => ctx.revert();
  }, [complete, reducedMotion]);

  return (
    <section
      id="contact"
      ref={rootRef}
      className="relative flex min-h-[100svh] items-center overflow-hidden bg-ocean-deep py-32"
    >
      <div
        ref={bgRef}
        className="absolute inset-0"
        style={{ opacity: 0 }}
      >
        <Image
          src={assets.contactBg}
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-ocean-deep/75" />
      </div>

      <div className="section-pad relative z-10 mx-auto w-full max-w-5xl text-center">
        <RevealText
          as="h2"
          variant="blur"
          className="font-display text-[clamp(2.6rem,8vw,6rem)] leading-[0.95] text-foam"
        >
          {athlete.contactHeadline}
        </RevealText>

        <div className="mt-12 flex justify-center">
          <MagneticButton href={`mailto:${athlete.email}`}>
            {athlete.contactCta}
          </MagneticButton>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-8">
          {athlete.socials.map((s, i) => (
            <a
              key={s.label}
              ref={(el) => {
                socialsRef.current[i] = el;
              }}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              data-cursor="VISIT ↗"
              className="text-[11px] tracking-[0.28em] text-foam-muted transition-colors hover:text-accent-teal"
              style={{ opacity: 0 }}
            >
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
