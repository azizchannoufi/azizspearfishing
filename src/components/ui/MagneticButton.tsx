"use client";

import {
  useRef,
  type ReactNode,
  type MouseEvent,
} from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { isTouchDevice } from "@/lib/motion";
import { useReducedMotion } from "@/components/providers/ReducedMotionProvider";

type MagneticButtonProps = {
  children: ReactNode;
  className?: string;
  strength?: number;
  href?: string;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  type?: "button" | "submit";
};

export function MagneticButton({
  children,
  className = "",
  strength = 0.28,
  href,
  onClick,
  type = "button",
}: MagneticButtonProps) {
  const ref = useRef<HTMLAnchorElement | HTMLButtonElement>(null);
  const { reducedMotion } = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 260, damping: 20, mass: 0.55 });
  const y = useSpring(my, { stiffness: 260, damping: 20, mass: 0.55 });

  const onMove = (e: MouseEvent) => {
    if (reducedMotion || isTouchDevice() || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    mx.set(dx * strength);
    my.set(dy * strength);
  };

  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  const classes = `inline-flex items-center justify-center gap-3 border border-foam/30 bg-foam/5 px-7 py-4 text-xs tracking-[0.22em] text-foam backdrop-blur-sm transition-colors hover:border-accent-teal/60 hover:bg-foam/10 ${className}`;

  if (href) {
    return (
      <motion.a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={href}
        onClick={onClick}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{ x, y }}
        data-cursor="ENTER"
        className={classes}
      >
        {children}
      </motion.a>
    );
  }

  return (
    <motion.button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type={type}
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x, y }}
      data-cursor="ENTER"
      className={classes}
    >
      {children}
    </motion.button>
  );
}
