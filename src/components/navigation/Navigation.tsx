"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { athlete, navLinks } from "@/lib/content";
import { usePreloader } from "@/components/providers/PreloaderProvider";
import { useLenis } from "@/components/providers/LenisProvider";
import { useSectionNav } from "@/components/ui/useSectionNav";

export function Navigation() {
  const { complete } = usePreloader();
  const { lenis } = useLenis();
  const { navigateTo } = useSectionNav();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (complete) setVisible(true);
  }, [complete]);

  useEffect(() => {
    const update = (y: number) => setScrolled(y > 40);
    if (lenis) {
      const unsub = lenis.on("scroll", ({ scroll }) => update(scroll));
      return () => {
        unsub?.();
      };
    }
    const onScroll = () => update(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [lenis]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const onNav = async (href: string) => {
    setOpen(false);
    await navigateTo(href);
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[80] transition-all duration-500 ${
          visible ? "opacity-100" : "pointer-events-none opacity-0"
        } ${
          scrolled
            ? "border-b border-white/10 bg-ocean-deep/70 backdrop-blur-md"
            : "bg-transparent"
        }`}
      >
        <div className="section-pad flex h-16 items-center justify-between md:h-20">
          <button
            type="button"
            onClick={() => onNav("#hero")}
            className="font-display text-xl tracking-[0.22em] text-foam"
            data-cursor="ENTER"
          >
            {athlete.name}
          </button>

          <nav className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => (
              <button
                key={link.href}
                type="button"
                onClick={() => onNav(link.href)}
                className="group relative text-[11px] tracking-[0.22em] text-foam/80 transition-colors hover:text-foam"
                data-cursor="ENTER"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-accent-teal transition-all duration-300 group-hover:w-full" />
              </button>
            ))}
          </nav>

          <button
            type="button"
            className="relative z-[90] flex h-10 w-10 flex-col items-center justify-center gap-1.5 lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <span
              className={`h-px w-6 bg-foam transition ${open ? "translate-y-[3.5px] rotate-45" : ""}`}
            />
            <span
              className={`h-px w-6 bg-foam transition ${open ? "-translate-y-[3.5px] -rotate-45" : ""}`}
            />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-ocean-deep/98 backdrop-blur-xl lg:hidden"
          >
            <div className="flex h-full flex-col justify-center gap-6 px-8">
              {navLinks.map((link, i) => (
                <motion.button
                  key={link.href}
                  type="button"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => onNav(link.href)}
                  className="font-display text-left text-4xl tracking-[0.12em] text-foam"
                >
                  {link.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
