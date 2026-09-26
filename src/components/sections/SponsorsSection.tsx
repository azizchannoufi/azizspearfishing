"use client";

import Image from "next/image";
import { useState } from "react";
import { assets } from "@/lib/assets";
import { marqueeText } from "@/lib/content";
import { RevealText } from "@/components/ui/RevealText";

export function SponsorsSection({ speed = 40 }: { speed?: number }) {
  const [paused, setPaused] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  return (
    <section id="sponsors" className="overflow-hidden bg-ocean-deep py-28 md:py-36">
      <div
        className="border-y border-white/10 py-3"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className="flex w-max whitespace-nowrap"
          style={{
            animation: `marquee ${speed}s linear infinite`,
            animationPlayState: paused ? "paused" : "running",
          }}
        >
          {[0, 1].map((n) => (
            <span
              key={n}
              className="font-display px-4 text-2xl tracking-[0.2em] text-foam/25 md:text-4xl"
            >
              {marqueeText}
              {marqueeText}
            </span>
          ))}
        </div>
      </div>

      <div className="section-pad mx-auto mt-20 max-w-5xl">
        <RevealText
          as="p"
          variant="blur"
          className="text-[11px] tracking-[0.35em] text-accent-teal"
        >
          PARTNERS
        </RevealText>
        <RevealText
          as="h2"
          variant="rise"
          className="font-display mt-4 text-[clamp(2.2rem,5vw,3.5rem)] text-foam"
        >
          TRUSTED IN THE DEEP
        </RevealText>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 md:grid-cols-3">
          {assets.sponsors.map((sponsor, i) => (
            <a
              key={sponsor.name}
              href={sponsor.href}
              data-cursor="VISIT ↗"
              className="group relative flex flex-col items-center border border-white/10 px-6 py-10 transition-colors hover:border-accent-teal/40"
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
            >
              <div
                className={`relative h-16 w-40 transition-all duration-500 ${
                  hoverIndex === i ? "scale-105 opacity-100" : "opacity-45"
                }`}
              >
                <Image
                  src={sponsor.logo}
                  alt={sponsor.name}
                  fill
                  sizes="160px"
                  className="object-contain"
                />
              </div>
              <div
                className={`mt-6 text-center transition-all duration-500 ${
                  hoverIndex === i
                    ? "translate-y-0 opacity-100"
                    : "translate-y-2 opacity-0"
                }`}
              >
                <p className="text-[10px] tracking-[0.25em] text-foam-muted">
                  {sponsor.role.toUpperCase()}
                </p>
                <p className="mt-2 text-xs tracking-[0.18em] text-accent-teal">
                  Discover partner →
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
