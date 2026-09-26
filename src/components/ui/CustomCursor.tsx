"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { isTouchDevice } from "@/lib/motion";
import { useReducedMotion } from "@/components/providers/ReducedMotionProvider";

type CursorLabel = "VIEW +" | "PLAY ▶" | "VISIT ↗" | "ENTER" | null;

export function CustomCursor() {
  const { reducedMotion } = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [label, setLabel] = useState<CursorLabel>(null);
  const [visible, setVisible] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 420, damping: 36, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 420, damping: 36, mass: 0.4 });

  useEffect(() => {
    if (reducedMotion || isTouchDevice()) {
      document.body.classList.remove("cursor-none");
      setEnabled(false);
      return;
    }

    setEnabled(true);
    document.body.classList.add("cursor-none");

    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
    };

    const onLeave = () => setVisible(false);

    const onOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest?.(
        "[data-cursor]",
      ) as HTMLElement | null;
      const raw = target?.dataset.cursor;
      if (
        raw === "VIEW +" ||
        raw === "PLAY ▶" ||
        raw === "VISIT ↗" ||
        raw === "ENTER"
      ) {
        setLabel(raw);
      } else {
        setLabel(null);
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    document.addEventListener("mouseleave", onLeave);

    return () => {
      document.body.classList.remove("cursor-none");
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, [reducedMotion, x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[10000] mix-blend-difference"
      style={{ x: sx, y: sy }}
    >
      <div
        className={`relative -translate-x-1/2 -translate-y-1/2 rounded-full bg-white transition-all duration-200 ${
          label ? "flex h-16 w-16 items-center justify-center" : "h-2.5 w-2.5"
        } ${visible ? "opacity-100" : "opacity-0"}`}
      >
        {label ? (
          <span className="text-[10px] font-medium tracking-[0.18em] text-black">
            {label}
          </span>
        ) : null}
      </div>
    </motion.div>
  );
}
