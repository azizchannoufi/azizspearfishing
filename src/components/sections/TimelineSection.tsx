"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { competitions } from "@/lib/content";
import { gsap, registerGsap } from "@/lib/gsap";
import { usePreloader } from "@/components/providers/PreloaderProvider";
import { useReducedMotion } from "@/components/providers/ReducedMotionProvider";
import { RevealText } from "@/components/ui/RevealText";

export function TimelineSection() {
  const rootRef = useRef<HTMLElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const { complete } = usePreloader();
  const { reducedMotion } = useReducedMotion();

  useEffect(() => {
    if (!complete || !rootRef.current || !lineRef.current) return;
    registerGsap();

    if (reducedMotion) {
      gsap.set(lineRef.current, { scaleY: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        lineRef.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top 60%",
            end: "bottom 70%",
            scrub: true,
          },
        },
      );

      gsap.utils.toArray<HTMLElement>(".timeline-item").forEach((item) => {
        const side = item.dataset.side;
        gsap.fromTo(
          item,
          {
            opacity: 0,
            x: side === "left" ? -80 : 80,
          },
          {
            opacity: 1,
            x: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: item,
              start: "top 80%",
              once: true,
            },
          },
        );

        const img = item.querySelector(".timeline-img");
        if (img) {
          gsap.fromTo(
            img,
            { scale: 1.15 },
            {
              scale: 1,
              duration: 1.2,
              ease: "power2.out",
              scrollTrigger: {
                trigger: item,
                start: "top 80%",
                once: true,
              },
            },
          );
        }

        const badge = item.querySelector(".timeline-badge");
        if (badge) {
          gsap.fromTo(
            badge,
            { opacity: 0, y: 20, scale: 0.9 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.7,
              delay: 0.15,
              ease: "back.out(1.4)",
              scrollTrigger: {
                trigger: item,
                start: "top 80%",
                once: true,
              },
            },
          );
        }
      });
    }, rootRef);

    return () => ctx.revert();
  }, [complete, reducedMotion]);

  return (
    <section
      ref={rootRef}
      className="relative overflow-hidden bg-ocean-deep py-28 md:py-36"
    >
      <div className="section-pad mx-auto max-w-5xl">
        <RevealText
          as="p"
          variant="blur"
          className="text-[11px] tracking-[0.35em] text-accent-teal"
        >
          COMPETITIONS
        </RevealText>
        <RevealText
          as="h2"
          variant="clip"
          className="font-display mt-4 text-[clamp(2.4rem,5vw,4rem)] text-foam"
        >
          THE TIMELINE
        </RevealText>

        <div className="relative mt-20">
          <div className="absolute top-0 bottom-0 left-4 w-px bg-white/10 md:left-1/2 md:-translate-x-1/2" />
          <div
            ref={lineRef}
            className="absolute top-0 left-4 h-full w-px origin-top bg-accent-teal md:left-1/2 md:-translate-x-1/2"
            style={{ transform: "scaleY(0)" }}
          />

          <div className="space-y-24">
            {competitions.map((c) => (
              <article
                key={c.year}
                data-side={c.side}
                className={`timeline-item relative grid gap-6 pl-12 md:grid-cols-2 md:gap-16 md:pl-0 ${
                  c.side === "right" ? "md:text-left" : "md:text-right"
                }`}
              >
                <div
                  className={`absolute top-2 left-[0.7rem] h-3 w-3 -translate-x-1/2 rounded-full border border-accent-teal bg-ocean-deep md:left-1/2`}
                />

                <div
                  className={`${
                    c.side === "right" ? "md:col-start-2" : "md:col-start-1"
                  }`}
                >
                  <p className="font-display text-5xl text-foam/30">{c.year}</p>
                  <h3 className="mt-2 font-display text-2xl text-foam md:text-3xl">
                    {c.title}
                  </h3>
                  <p className="mt-2 text-sm text-foam-muted">{c.location}</p>
                  <span className="timeline-badge mt-4 inline-flex border border-accent-teal/50 px-3 py-1 text-[11px] tracking-[0.2em] text-accent-teal">
                    {c.place}
                  </span>
                </div>

                <div
                  className={`overflow-hidden ${
                    c.side === "right"
                      ? "md:col-start-1 md:row-start-1"
                      : "md:col-start-2"
                  }`}
                >
                  <div className="timeline-img relative aspect-[16/10] will-change-transform">
                    <Image
                      src={c.image}
                      alt={c.title}
                      fill
                      sizes="(max-width:768px) 100vw, 40vw"
                      className="object-cover"
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
