"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { assets } from "@/lib/assets";
import { RevealText } from "@/components/ui/RevealText";

export function GallerySection() {
  const items = assets.gallery;
  const [active, setActive] = useState<number | null>(null);

  const close = useCallback(() => setActive(null), []);
  const next = useCallback(() => {
    setActive((i) => (i === null ? 0 : (i + 1) % items.length));
  }, [items.length]);
  const prev = useCallback(() => {
    setActive((i) =>
      i === null ? 0 : (i - 1 + items.length) % items.length,
    );
  }, [items.length]);

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [active, close, next, prev]);

  return (
    <section id="gallery" className="bg-ocean-deep py-28 md:py-36">
      <div className="section-pad mx-auto max-w-6xl">
        <RevealText
          as="p"
          variant="blur"
          className="text-[11px] tracking-[0.35em] text-accent-teal"
        >
          GALLERY
        </RevealText>
        <RevealText
          as="h2"
          variant="rise"
          className="font-display mt-4 text-[clamp(2.4rem,5vw,4rem)] text-foam"
        >
          MOMENTS BELOW
        </RevealText>

        <div className="mt-14 columns-1 gap-4 sm:columns-2 lg:columns-3">
          {items.map((item, i) => (
            <button
              key={`${item.src}-${i}`}
              type="button"
              data-cursor="VIEW +"
              onClick={() => setActive(i)}
              className="group relative mb-4 block w-full break-inside-avoid overflow-hidden"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image
                  src={item.src}
                  alt={item.title}
                  fill
                  sizes="(max-width:768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-ocean-deep/0 transition-colors duration-500 group-hover:bg-ocean-deep/45" />
                <div className="absolute inset-x-0 bottom-0 translate-y-4 p-5 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  <p className="text-[11px] tracking-[0.25em] text-foam">
                    {item.label}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {active !== null ? (
          <motion.div
            className="fixed inset-0 z-[9500] flex items-center justify-center bg-ocean-deep/92 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          >
            <button
              type="button"
              className="absolute top-6 right-6 text-xs tracking-[0.2em] text-foam"
              onClick={close}
            >
              CLOSE ESC
            </button>
            <button
              type="button"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-foam md:left-8"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
            >
              ←
            </button>
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-foam md:right-8"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
            >
              →
            </button>
            <motion.div
              key={active}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative max-h-[85vh] w-full max-w-5xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-[16/10] w-full">
                <Image
                  src={items[active].src}
                  alt={items[active].title}
                  fill
                  sizes="90vw"
                  className="object-contain"
                  priority
                />
              </div>
              <p className="mt-4 text-center text-[11px] tracking-[0.28em] text-foam-muted">
                {items[active].label}
              </p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
