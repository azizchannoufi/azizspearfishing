"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { assets } from "@/lib/assets";
import { gsap, registerGsap } from "@/lib/gsap";
import { usePreloader } from "@/components/providers/PreloaderProvider";
import { useReducedMotion } from "@/components/providers/ReducedMotionProvider";
import { RevealText } from "@/components/ui/RevealText";

export function VideoSection() {
  const rootRef = useRef<HTMLElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const { complete } = usePreloader();
  const { reducedMotion } = useReducedMotion();

  useEffect(() => {
    if (!complete || !rootRef.current || !thumbRef.current || reducedMotion)
      return;
    registerGsap();
    const ctx = gsap.context(() => {
      gsap.fromTo(
        thumbRef.current,
        { scale: 0.94 },
        {
          scale: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top 75%",
            end: "top 35%",
            scrub: true,
          },
        },
      );
    }, rootRef);
    return () => ctx.revert();
  }, [complete, reducedMotion]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <section
      id="videos"
      ref={rootRef}
      className="bg-gradient-to-b from-ocean-deep via-ocean-mid/30 to-ocean-deep py-28 md:py-36"
    >
      <div className="section-pad mx-auto max-w-5xl">
        <RevealText
          as="p"
          variant="blur"
          className="text-[11px] tracking-[0.35em] text-accent-teal"
        >
          FILM
        </RevealText>
        <RevealText
          as="h2"
          variant="clip"
          className="font-display mt-4 text-[clamp(2.4rem,5vw,4rem)] text-foam"
        >
          INTO THE BLUE
        </RevealText>

        <div
          ref={thumbRef}
          className="relative mt-12 aspect-video overflow-hidden will-change-transform"
        >
          <Image
            src={assets.video.poster}
            alt="Video thumbnail"
            fill
            sizes="90vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-ocean-deep/35" />
          <button
            type="button"
            data-cursor="PLAY ▶"
            onClick={() => setOpen(true)}
            className="group absolute inset-0 flex items-center justify-center"
            aria-label="Play video"
          >
            <span className="relative flex h-24 w-24 items-center justify-center">
              <span className="absolute inset-0 animate-ping rounded-full border border-foam/30 opacity-40" />
              <span className="absolute inset-0 rounded-full border border-foam/50 transition group-hover:scale-110 group-hover:border-accent-teal" />
              <span className="relative text-[11px] tracking-[0.25em] text-foam">
                PLAY
              </span>
            </span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[9600] flex items-center justify-center bg-ocean-deep/95 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-5xl overflow-hidden bg-black"
              onClick={(e) => e.stopPropagation()}
            >
              <video
                src={assets.video.src}
                controls
                autoPlay
                playsInline
                className="aspect-video w-full"
              />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
