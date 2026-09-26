"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { journeyChapters } from "@/lib/content";
import { gsap, registerGsap, ScrollTrigger } from "@/lib/gsap";
import { usePreloader } from "@/components/providers/PreloaderProvider";
import { useReducedMotion } from "@/components/providers/ReducedMotionProvider";
import { RevealText } from "@/components/ui/RevealText";

export function JourneySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const { complete } = usePreloader();
  const { reducedMotion } = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!complete || !sectionRef.current || !trackRef.current) return;
    if (isMobile || reducedMotion) return;
    registerGsap();

    const section = sectionRef.current;
    const track = trackRef.current;
    const getScroll = () => Math.max(0, track.scrollWidth - window.innerWidth);

    const ctx = gsap.context(() => {
      gsap.to(track, {
        x: () => -getScroll(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${getScroll()}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
    }, section);

    return () => {
      ctx.revert();
      ScrollTrigger.refresh();
    };
  }, [complete, isMobile, reducedMotion]);

  return (
    <section
      id="career"
      ref={sectionRef}
      className="relative overflow-hidden bg-ocean-deep"
    >
      <div className="section-pad absolute top-10 left-0 z-10 md:top-16">
        <RevealText
          as="p"
          variant="blur"
          className="text-[11px] tracking-[0.35em] text-accent-teal"
        >
          THE JOURNEY
        </RevealText>
      </div>

      <div
        ref={trackRef}
        className={`flex ${
          isMobile || reducedMotion
            ? "snap-x snap-mandatory overflow-x-auto hide-scrollbar gap-4 px-4 py-24"
            : "h-screen w-max items-center gap-8 pl-[12vw] pr-[20vw]"
        }`}
      >
        {journeyChapters.map((chapter) => (
          <article
            key={chapter.id}
            className={`relative shrink-0 overflow-hidden ${
              isMobile || reducedMotion
                ? "snap-center w-[85vw] aspect-[3/4]"
                : "h-[70vh] w-[70vw] max-w-4xl"
            }`}
          >
            <Image
              src={chapter.image}
              alt={chapter.title}
              fill
              sizes="70vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ocean-deep via-ocean-deep/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-8 md:p-12">
              <h3 className="font-display text-4xl text-foam md:text-6xl">
                {chapter.title}
              </h3>
              <p className="mt-3 max-w-md text-sm text-foam-muted md:text-base">
                {chapter.copy}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
