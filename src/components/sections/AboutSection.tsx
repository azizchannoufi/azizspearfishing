"use client";

import Image from "next/image";
import { athlete } from "@/lib/content";
import { assets } from "@/lib/assets";
import { RevealText } from "@/components/ui/RevealText";
import { RevealImage } from "@/components/ui/RevealImage";

export function AboutSection() {
  return (
    <section id="about" className="relative overflow-hidden bg-ocean-deep py-28 md:py-40">
      <div className="section-pad mx-auto grid max-w-6xl gap-12 md:grid-cols-12 md:gap-16">
        <div className="md:col-span-5">
          <RevealText
            as="p"
            variant="blur"
            className="text-[11px] tracking-[0.35em] text-accent-teal"
          >
            ABOUT
          </RevealText>
          <RevealText
            as="h2"
            variant="clip"
            className="font-display mt-4 text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.95] text-foam"
          >
            {athlete.aboutTitle}
          </RevealText>
          <RevealText
            as="p"
            variant="rise"
            delay={0.1}
            className="mt-8 max-w-md text-base leading-relaxed text-foam-muted md:text-lg"
          >
            {athlete.about}
          </RevealText>
          <RevealText
            as="p"
            variant="blur"
            delay={0.15}
            className="font-display mt-10 text-2xl text-foam md:text-3xl"
          >
            {athlete.headline}
          </RevealText>
        </div>

        <div className="md:col-span-7">
          <RevealImage variant="mask" className="aspect-[4/5] w-full md:aspect-[5/4]">
            <Image
              src={assets.journey.training}
              alt="Beneath the surface"
              fill
              sizes="(max-width: 768px) 100vw, 55vw"
              className="object-cover"
            />
          </RevealImage>
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-ocean-mid/40"
      />
    </section>
  );
}
